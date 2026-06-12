"""
Beauty Pipeline API Server

FastAPI 后端服务，封装 BeautyPipeline 为 REST API。
前端（Next.js on Vercel）通过此 API 与 GPU 后端通信。

启动方式:
    conda activate qwen3vl
    cd /apps/users/xzl/aesthetic
    python -m beauty_pipeline.api_server
"""
from __future__ import annotations

import os
import shutil
import threading
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from beauty_pipeline.config import BeautyPipelineConfig
from beauty_pipeline.pipeline import BeautyPipeline

# ============ 配置 ============
HOST = "0.0.0.0"
PORT = 8000
UPLOAD_DIR = "/apps/users/xzl/aesthetic/beauty_pipeline/uploads"
OUTPUT_BASE = "/apps/users/xzl/aesthetic/beauty_pipeline/task_outputs"
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://cosmetology-nine.vercel.app",
]

app = FastAPI(title="Beauty Pipeline API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录（生成的图片）
os.makedirs(OUTPUT_BASE, exist_ok=True)
app.mount("/static", StaticFiles(directory=OUTPUT_BASE), name="static")

# ============ 任务存储 ============
tasks: dict[str, dict] = {}
pipeline_lock = threading.Lock()
pipeline_instance: BeautyPipeline | None = None


def get_pipeline() -> BeautyPipeline:
    """获取全局 pipeline 实例（懒加载）"""
    global pipeline_instance
    if pipeline_instance is None:
        config = BeautyPipelineConfig()
        pipeline_instance = BeautyPipeline(config)
    return pipeline_instance


def _serialize_result(result, task_id: str) -> dict:
    """将 BeautyPipelineResult 序列化为 JSON 字典"""
    return {
        "original_score": {
            "score": result.original_score.score,
            "level": result.original_score.level,
        },
        "generated_score": {
            "score": result.generated_score.score,
            "level": result.generated_score.level,
        },
        "score_diff": round(
            result.generated_score.score - result.original_score.score, 4
        ),
        "user_requirement": result.user_requirement,
        "advice": {
            "strengths": result.advice.strengths,
            "weaknesses": result.advice.weaknesses,
            "medical_aesthetic_suggestions": result.advice.medical_aesthetic_suggestions,
            "risk_notes": result.advice.risk_notes,
            "full_text": result.advice.full_text,
        },
        "summary": result.summary,
        "original_image_url": f"/static/{task_id}/original.png",
        "generated_image_url": f"/static/{task_id}/generated.png",
    }


def _run_pipeline_task(
    task_id: str,
    image_path: str,
    user_requirement: str | None,
    output_dir: str,
):
    """后台执行 pipeline（在独立线程中运行）"""
    global pipeline_instance
    try:
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["progress"] = "Step 1/5: SCUT 颜值评分中..."

        # 为每个任务创建独立的输出目录
        task_output = os.path.join(output_dir, "pipeline_output")
        os.makedirs(task_output, exist_ok=True)

        # 进度回调：更新 tasks 字典中的 progress
        def on_progress(step: int, total: int, msg: str):
            tasks[task_id]["progress"] = f"Step {step}/{total}: {msg}"

        # 修改 pipeline 的 output_dir
        with pipeline_lock:
            pipeline = get_pipeline()
            original_output_dir = pipeline.config.output_dir
            pipeline.config.output_dir = task_output

            try:
                result = pipeline.run(
                    image_path=image_path,
                    user_requirement=user_requirement,
                    on_progress=on_progress,
                )
            finally:
                pipeline.config.output_dir = original_output_dir

        # 复制结果到任务目录
        shutil.copy2(
            os.path.join(task_output, "original.png"),
            os.path.join(output_dir, "original.png"),
        )
        shutil.copy2(
            os.path.join(task_output, "generated.png"),
            os.path.join(output_dir, "generated.png"),
        )
        # 复制 result.json 和 report.md
        for fname in ("result.json", "report.md"):
            src = os.path.join(task_output, fname)
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(output_dir, fname))

        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = "完成"
        tasks[task_id]["result"] = _serialize_result(result, task_id)
        tasks[task_id]["completed_at"] = datetime.now(timezone.utc).isoformat()

    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
        tasks[task_id]["completed_at"] = datetime.now(timezone.utc).isoformat()


# ============ API 端点 ============


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(
    image: UploadFile = File(...),
    user_requirement: str | None = Form(None),
):
    """
    上传图片并启动分析任务。

    返回 task_id，前端通过 GET /api/tasks/{task_id} 轮询结果。
    """
    # 生成任务 ID
    task_id = uuid.uuid4().hex[:12]

    # 保存上传的图片
    task_upload_dir = os.path.join(UPLOAD_DIR, task_id)
    os.makedirs(task_upload_dir, exist_ok=True)
    image_path = os.path.join(task_upload_dir, "input.jpg")

    contents = await image.read()
    with open(image_path, "wb") as f:
        f.write(contents)

    # 创建任务输出目录
    task_output_dir = os.path.join(OUTPUT_BASE, task_id)
    os.makedirs(task_output_dir, exist_ok=True)

    # 注册任务
    tasks[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "progress": "排队中...",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "result": None,
        "error": None,
        "output_dir": task_output_dir,
    }

    # 在后台线程中启动 pipeline
    thread = threading.Thread(
        target=_run_pipeline_task,
        args=(task_id, image_path, user_requirement, task_output_dir),
        daemon=True,
    )
    thread.start()

    return JSONResponse(
        status_code=202,
        content={"task_id": task_id, "status": "pending"},
    )


@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """查询任务状态和结果"""
    if task_id not in tasks:
        return JSONResponse(
            status_code=404,
            content={"error": "任务不存在"},
        )

    task = tasks[task_id]
    return {
        "task_id": task["task_id"],
        "status": task["status"],
        "progress": task["progress"],
        "result": task["result"],
        "error": task["error"],
        "created_at": task["created_at"],
        "completed_at": task["completed_at"],
    }


@app.get("/api/tasks/{task_id}/report")
async def get_report(task_id: str):
    """获取 Markdown 报告"""
    if task_id not in tasks:
        return JSONResponse(status_code=404, content={"error": "任务不存在"})

    report_path = os.path.join(OUTPUT_BASE, task_id, "report.md")
    if not os.path.exists(report_path):
        return JSONResponse(status_code=404, content={"error": "报告尚未生成"})

    with open(report_path, "r", encoding="utf-8") as f:
        report = f.read()

    return {"report": report}


@app.get("/api/tasks")
async def list_tasks():
    """列出所有任务（调试用）"""
    return [
        {
            "task_id": t["task_id"],
            "status": t["status"],
            "created_at": t["created_at"],
        }
        for t in tasks.values()
    ]


# ============ 启动 ============
if __name__ == "__main__":
    import uvicorn

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(OUTPUT_BASE, exist_ok=True)
    print(f"🚀 Beauty Pipeline API Server")
    print(f"   地址: http://{HOST}:{PORT}")
    print(f"   健康检查: http://localhost:{PORT}/health")
    print(f"   上传目录: {UPLOAD_DIR}")
    print(f"   输出目录: {OUTPUT_BASE}")
    uvicorn.run(app, host=HOST, port=PORT)
