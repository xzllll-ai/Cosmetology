"""
Beauty Pipeline 主编排器（新流程：4 步）

新流程：
  1. Qwen 评分 + 医学美学分析（5维度独立评分 + 加权总分）
  2a. RealVision 生成效果图（精准提示词，只改用户指定区域）
  2b. Qwen 对生成图二次评分（前后对比）
  3. Qwen 生成变化总结
"""
from __future__ import annotations

import json
import os
import shutil
import time

from beauty_pipeline.adapters.qwen_adapter import QwenAdapter
from beauty_pipeline.adapters.realvision_adapter import RealVisionAdapter
from beauty_pipeline.config import BeautyPipelineConfig
from beauty_pipeline.modules.advisor import Advisor
from beauty_pipeline.modules.generator import Generator
from beauty_pipeline.modules.summarizer import Summarizer
from beauty_pipeline.prompts.qwen_prompts import build_score_after_generation_prompt, build_summary_prompt
from beauty_pipeline.schemas import BeautyPipelineResult, BeautyScore
from beauty_pipeline.utils.image_io import ensure_dir
from beauty_pipeline.utils.logging_utils import setup_logger, step_log


class BeautyPipeline:
    """
    医学美容分析 + 效果图生成 + 变化总结 流水线

    Usage:
        config = BeautyPipelineConfig()
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
        执行完整流水线（4 步流程）。

        Args:
            image_path: 用户原始照片路径
            user_requirement: 用户美容需求（可选）
            on_progress: 进度回调函数，签名 on_progress(step: int, total: int, msg: str)

        Returns:
            BeautyPipelineResult 完整结果
        """
        total_steps = 4
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

        # ── Step 1: Qwen 评分 + 医学美学分析 ──
        _report(1, "Qwen 评分与医学美学分析中...")
        score, advice = self.advisor.analyze(
            image_path=image_path,
            user_requirement=user_requirement,
        )
        self.logger.info("  -> Qwen 评分: %.2f (%s)", score.total_score, score.level)

        # ── Step 2a: RealVision 生成效果图 ──
        _report(2, "RealVision 生成美容效果图（基于用户需求精准优化）...")
        generated = self.generator.generate(
            image_path=image_path,
            user_requirement=user_requirement or "自然美容改善",
            analysis_full_text=advice.full_text,
            output_path=generated_path,
        )
        self.logger.info("  -> 效果图已生成: %s", generated.generated_image_path)

        # ── Step 2b: Qwen 对生成图二次评分 ──
        _report(3, "Qwen 对 AI 效果图进行二次评分...")
        generated_score = self._score_generated_image(
            image_path=generated_path,
            user_requirement=user_requirement,
        )
        self.logger.info("  -> 生成图评分: %.2f (%s)", generated_score.total_score, generated_score.level)

        # ── Step 3: Qwen 生成变化总结 ──
        _report(4, "Qwen 生成变化总结...")
        summary = self.summarizer.summarize(
            score=score,
            advice=advice,
            user_requirement=user_requirement or "自然美容改善",
        )

        # ── 计算分数差异 ──
        score_diff = round(generated_score.total_score - score.total_score, 2)

        # ── 组装结果 ──
        result = BeautyPipelineResult(
            original_image_path=original_copy,
            generated_image_path=generated.generated_image_path,
            original_score=score,
            generated_score=generated_score,
            score_diff=score_diff,
            advice=advice,
            summary=summary,
            user_requirement=user_requirement or "",
        )

        # ── 保存结果 ──
        self._save_results(result, output_dir)

        elapsed = time.time() - start_time
        self.logger.info("=" * 60)
        self.logger.info("流水线完成！耗时 %.1f 秒", elapsed)
        self.logger.info("  原始评分: %.2f (%s)", score.total_score, score.level)
        self.logger.info("  生成图评分: %.2f (%s)", generated_score.total_score, generated_score.level)
        self.logger.info("  分数变化: %+.2f", score_diff)
        self.logger.info("  输出目录: %s", os.path.abspath(output_dir))

        return result

    def _score_generated_image(
        self,
        image_path: str,
        user_requirement: str | None = None,
    ) -> "BeautyScore":
        """对生成的效果图用 Qwen 再次评分（用于前后对比）。"""
        from beauty_pipeline.schemas import BeautyScore
        prompt = build_score_after_generation_prompt(user_requirement=user_requirement)
        full_text = self._qwen_adapter.chat_with_image(image_path, prompt)
        score = self._qwen_adapter._extract_score_multidim(full_text)
        return score

    def _save_results(self, result: BeautyPipelineResult, output_dir: str):
        """保存结构化结果和用户报告"""
        # 保存 result.json
        result_dict = {
            "original_image_path": result.original_image_path,
            "generated_image_path": result.generated_image_path,
            "original_score": {
                "total_score": result.original_score.total_score if result.original_score else 0,
                "level": result.original_score.level if result.original_score else "中等",
                "sub_dimensions": [
                    {
                        "name": sd.name,
                        "score": sd.score,
                        "max_score": sd.max_score,
                        "description": sd.description,
                        "evidence": sd.evidence,
                    }
                    for sd in (result.original_score.sub_dimensions if result.original_score else [])
                ],
            },
            "generated_score": {
                "total_score": result.generated_score.total_score if result.generated_score else 0,
                "level": result.generated_score.level if result.generated_score else "中等",
                "sub_dimensions": [
                    {
                        "name": sd.name,
                        "score": sd.score,
                        "max_score": sd.max_score,
                        "description": sd.description,
                        "evidence": sd.evidence,
                    }
                    for sd in (result.generated_score.sub_dimensions if result.generated_score else [])
                ],
            },
            "score_diff": result.score_diff,
            "user_requirement": result.user_requirement,
            "advice": {
                "strengths": result.advice.strengths if result.advice else [],
                "weaknesses": result.advice.weaknesses if result.advice else [],
                "medical_aesthetic_suggestions": result.advice.medical_aesthetic_suggestions if result.advice else [],
                "risk_notes": result.advice.risk_notes if result.advice else [],
                "full_text": result.advice.full_text if result.advice else "",
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
        lines = [
            "# 医学美容分析报告",
            "",
            "---",
            "",
            "## 评分概览",
            "",
        ]

        if result.original_score:
            lines.extend([
                "### 原始照片评分",
                "",
                f"| 维度 | 评分 | 权重 |",
                f"|------|------|------|",
            ])
            for sd in result.original_score.sub_dimensions:
                weight_map = {"皮肤状态": "25%", "轮廓线条": "25%", "五官精致度": "25%", "色泽质感": "15%", "比例协调": "10%"}
                weight = weight_map.get(sd.name, "N/A")
                lines.append(f"| {sd.name} | {sd.score:.1f} | {weight} |")
            lines.append(f"| **总分** | **{result.original_score.total_score:.2f}** | **100%** |")
            lines.append("")

        if result.generated_score:
            lines.extend([
                "### AI 效果图评分",
                "",
                f"| 维度 | 评分 | 权重 |",
                f"|------|------|------|",
            ])
            for sd in result.generated_score.sub_dimensions:
                weight_map = {"皮肤状态": "25%", "轮廓线条": "25%", "五官精致度": "25%", "色泽质感": "15%", "比例协调": "10%"}
                weight = weight_map.get(sd.name, "N/A")
                lines.append(f"| {sd.name} | {sd.score:.1f} | {weight} |")
            lines.append(f"| **总分** | **{result.generated_score.total_score:.2f}** | **100%** |")
            lines.append("")

        if result.score_diff is not None:
            lines.extend([
                f"### 分数变化",
                "",
                f"变化值: **{result.score_diff:+.2f}**",
                "",
            ])

        if result.user_requirement:
            lines.extend([
                "## 用户需求",
                "",
                f"> {result.user_requirement}",
                "",
            ])

        if result.advice:
            lines.extend([
                "## 医学美学分析",
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
                lines.append("### 风险提示")
                lines.append("")
                for r in result.advice.risk_notes:
                    lines.append(f"- {r}")
                lines.append("")

        if result.summary:
            lines.extend([
                "## 变化总结",
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
