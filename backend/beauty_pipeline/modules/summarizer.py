"""
Summarizer 模块

封装 Qwen 变化总结功能，提供高层接口。
"""
from __future__ import annotations

from beauty_pipeline.adapters.qwen_adapter import QwenAdapter
from beauty_pipeline.prompts.qwen_prompts import build_summary_prompt
from beauty_pipeline.schemas import BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Summarizer:
    """变化总结模块"""

    def __init__(self, adapter: QwenAdapter):
        self.adapter = adapter

    def summarize(
        self,
        original_score: BeautyScore,
        generated_score: BeautyScore,
        user_requirement: str,
        advice_summary: str = "",
    ) -> str:
        """
        生成前后变化总结报告。

        Args:
            original_score: 原图评分
            generated_score: 效果图评分
            user_requirement: 用户需求
            advice_summary: 之前的分析建议摘要

        Returns:
            总结报告文本
        """
        score_diff = generated_score.score - original_score.score

        prompt = build_summary_prompt(
            original_score=original_score.score,
            original_level=original_score.level,
            generated_score=generated_score.score,
            generated_level=generated_score.level,
            score_diff=score_diff,
            user_requirement=user_requirement,
            advice_summary=advice_summary,
        )

        logger.info("生成前后变化总结...")
        summary = self.adapter.summarize(prompt)
        logger.info("总结生成完成 (%d 字符)", len(summary))
        return summary
