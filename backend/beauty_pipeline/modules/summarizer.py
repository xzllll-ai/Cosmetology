"""
Summarizer 模块

封装 Qwen 变化总结功能，提供高层接口。
去掉了原来的 SCUT 前后评分对比，总结仅基于 Qwen 的分析与评分。
"""
from __future__ import annotations

from beauty_pipeline.adapters.qwen_adapter import QwenAdapter
from beauty_pipeline.prompts.qwen_prompts import build_summary_prompt
from beauty_pipeline.schemas import BeautyAdvice, BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Summarizer:
    """变化总结模块（基于 Qwen）"""

    def __init__(self, adapter: QwenAdapter):
        self.adapter = adapter

    def summarize(
        self,
        score: BeautyScore,
        advice: BeautyAdvice,
        user_requirement: str,
    ) -> str:
        """
        基于 Qwen 评分和建议生成总结报告。

        Args:
            score: Qwen 给出的评分
            advice: Qwen 给出的结构化建议
            user_requirement: 用户需求

        Returns:
            总结报告文本
        """
        # 取建议的简要文本（截断避免超长）
        advice_summary = advice.full_text[:800] if advice.full_text else ""
        if not advice_summary and advice.medical_aesthetic_suggestions:
            advice_summary = "；".join(advice.medical_aesthetic_suggestions)

        prompt = build_summary_prompt(
            score=score.score,
            level=score.level,
            user_requirement=user_requirement,
            advice_summary=advice_summary,
        )

        logger.info("生成变化总结...")
        summary = self.adapter.summarize(prompt)
        logger.info("总结生成完成 (%d 字符)", len(summary))
        return summary
