"""
Beauty Pipeline 主编排器

串联所有模块，实现完整的"评分 → 建议 → 生成 → 复评 → 总结"流水线。
"""
from __future__ import annotations

import json
import os
import shutil
import time
from dataclasses import asdict

from beauty_pipeline.adapters.qwen_adapter import QwenAdapter
from beauty_pipeline.adapters.realvision_adapter import RealVisionAdapter
from beauty_pipeline.adapters.scut_adapter import SCUTAdapter
from beauty_pipeline.config import BeautyPipelineConfig
from beauty_pipeline.modules.advisor import Advisor
from beauty_pipeline.modules.generator import Generator
from beauty_pipeline.modules.scorer import Scorer
from beauty_pipeline.modules.summarizer import Summarizer
from beauty_pipeline.schemas import BeautyPipelineResult
from beauty_pipeline.utils.image_io import ensure_dir
from beauty_pipeline.utils.logging_utils import setup_logger, step_log


class BeautyPipeline:
    """
    医学美容评分 + 建议 + 效果图生成 + 复评 + 总结 流水线

    Usage:
        config = BeautyPipelineConfig(...)
        pipeline = BeautyPipeline(config)
        result = pipeline.run(
            image_path="test.jpg",
            user_requirement="我想让皮肤更紧致"
        )
    """

    def __init__(self, config: BeautyPipelineConfig):
        self.config = config
        self.logger = setup_logger("beauty_pipeline", config.log_level)

        # 初始化 adapters
        self._scut_adapter = SCUTAdapter(
            model_path=config.scut_model_path,
            device=config.scut_device,
        )
        self._qwen_adapter = QwenAdapter(
            model_path=config.qwen_model_path,
            device=config.qwen_device,
            max_tokens=config.qwen_max_tokens,
            temperature=config.qwen_temperature,
            top_p=config.qwen_top_p,
        )
        self._realvision_adapter = RealVisionAdapter(
            model_path=config.realvision_model_path,
            device=config.realvision_device,
            strength=config.realvision_strength,
            guidance_scale=config.realvision_guidance_scale,
            steps=config.realvision_steps,
            seed=config.realvision_seed,
        )

        # 初始化 modules
        self.scorer = Scorer(self._scut_adapter)
        self.advisor = Advisor(self._qwen_adapter)
        self.generator = Generator(self._realvision_adapter)
        self.summarizer = Summarizer(self._qwen_adapter)

    def run(
        self,
        image_path: str,
        user_requirement: str | None = None,
        on_progress: "callable | None" = None,
    ) -> BeautyPipelineResult:
        """
        执行完整流水线。

        Args:
            image_path: 用户原始照片路径
            user_requirement: 用户美容需求（可选）
            on_progress: 进度回调函数，签名 on_progress(step: int, total: int, msg: str)

        Returns:
            BeautyPipelineResult 完整结果
        """
        total_steps = 5
        start_time = time.time()

        def _report(step: int, msg: str):
            step_log(self.logger, step, total_steps, msg)
            if on_progress:
                on_progress(step, total_steps, msg)

        # 准备输出目录
        output_dir = ensure_dir(self.config.output_dir)
        original_copy = os.path.join(output_dir, "original.png")
        generated_path = os.path.join(output_dir, "generated.png")

        # 复制原图到输出目录
        shutil.copy2(image_path, original_copy)
        self.logger.info("输出目录: %s", os.path.abspath(output_dir))
        self.logger.info("=" * 60)

        # ── Step 1: SCUT 初始评分 ──
        _report(1, "SCUT 颜值评分中...")
        original_score = self.scorer.score(image_path)
        self.logger.info("  → 原始评分: %.4f (%s)", original_score.score, original_score.level)

        # ── Step 2: Qwen 医学美学分析 ──
        _report(2, "Qwen 医学美学分析...")
        advice = self.advisor.analyze(
            image_path=image_path,
            score=original_score,
            user_requirement=user_requirement,
        )
        self.logger.info("  → 分析完成")

        # ── Step 3: RealVision 生成效果图 ──
        _report(3, "RealVision 生成美容效果图...")
        generated = self.generator.generate(
            image_path=image_path,
            user_requirement=user_requirement or "自然美容改善",
            advice=advice,
            output_path=generated_path,
        )
        self.logger.info("  → 效果图已生成: %s", generated.generated_image_path)

        # ── Step 4: SCUT 复评 ──
        _report(4, "SCUT 效果图复评中...")
        generated_score = self.scorer.score(generated.generated_image_path)
        score_diff = generated_score.score - original_score.score
        self.logger.info("  → 生成后评分: %.4f (%s), 变化: %+.4f",
                         generated_score.score, generated_score.level, score_diff)

        # ── Step 5: Qwen 总结 ──
        _report(5, "Qwen 生成变化总结...")
        summary = self.summarizer.summarize(
            original_score=original_score,
            generated_score=generated_score,
            user_requirement=user_requirement or "自然美容改善",
            advice_summary=advice.full_text[:500],
        )

        # ── 组装结果 ──
        result = BeautyPipelineResult(
            original_image_path=original_copy,
            generated_image_path=generated.generated_image_path,
            original_score=original_score,
            generated_score=generated_score,
            advice=advice,
            summary=summary,
            user_requirement=user_requirement or "",
        )

        # ── 保存结果 ──
        self._save_results(result, output_dir)

        elapsed = time.time() - start_time
        self.logger.info("=" * 60)
        self.logger.info("✅ 流水线完成！耗时 %.1f 秒", elapsed)
        self.logger.info("  原始评分: %.4f (%s)", original_score.score, original_score.level)
        self.logger.info("  生成后评分: %.4f (%s)", generated_score.score, generated_score.level)
        self.logger.info("  分数变化: %+.4f", score_diff)
        self.logger.info("  输出目录: %s", os.path.abspath(output_dir))

        return result

    def _save_results(self, result: BeautyPipelineResult, output_dir: str):
        """保存结构化结果和用户报告"""
        # 保存 result.json
        result_dict = {
            "original_image_path": result.original_image_path,
            "generated_image_path": result.generated_image_path,
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
        }

        result_json_path = os.path.join(output_dir, "result.json")
        with open(result_json_path, "w", encoding="utf-8") as f:
            json.dump(result_dict, f, ensure_ascii=False, indent=2)
        self.logger.info("  结果已保存: %s", result_json_path)

        # 保存 report.md
        report = self._build_report(result)
        report_path = os.path.join(output_dir, "report.md")
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report)
        self.logger.info("  报告已保存: %s", report_path)

    def _build_report(self, result: BeautyPipelineResult) -> str:
        """构建用户可读的 Markdown 报告"""
        score_diff = result.generated_score.score - result.original_score.score

        lines = [
            "# 医学美容分析报告",
            "",
            "---",
            "",
            "## 📊 评分概览",
            "",
            f"| 项目 | 评分 | 等级 |",
            f"|------|------|------|",
            f"| 原始照片 | {result.original_score.score:.2f} | {result.original_score.level} |",
            f"| 美容效果 | {result.generated_score.score:.2f} | {result.generated_score.level} |",
            f"| 变化 | {score_diff:+.2f} | - |",
            "",
        ]

        if result.user_requirement:
            lines.extend([
                "## 💡 用户需求",
                "",
                f"> {result.user_requirement}",
                "",
            ])

        if result.advice:
            lines.extend([
                "## 🔍 医学美学分析",
                "",
            ])

            if result.advice.strengths:
                lines.append("### 当前优点")
                lines.append("")
                for s in result.advice.strengths:
                    lines.append(f"- {s}")
                lines.append("")

            if result.advice.weaknesses:
                lines.append("### 可改善方面")
                lines.append("")
                for w in result.advice.weaknesses:
                    lines.append(f"- {w}")
                lines.append("")

            if result.advice.medical_aesthetic_suggestions:
                lines.append("### 医学美学建议")
                lines.append("")
                for s in result.advice.medical_aesthetic_suggestions:
                    lines.append(f"- {s}")
                lines.append("")

            if result.advice.risk_notes:
                lines.append("### ⚠️ 风险提示")
                lines.append("")
                for r in result.advice.risk_notes:
                    lines.append(f"- {r}")
                lines.append("")

        if result.summary:
            lines.extend([
                "## 📝 变化总结",
                "",
                result.summary,
                "",
            ])

        lines.extend([
            "---",
            "",
            "> **免责声明**：本报告由 AI 系统生成，仅供参考，不构成医疗建议。",
            "> 所有医学美容项目建议请咨询专业医生后决定。",
            "",
        ])

        return "\n".join(lines)
