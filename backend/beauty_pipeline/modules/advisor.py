"""
Advisor 模块

封装 Qwen 医学美学分析 + 评分功能，提供高层接口。
一次推理同时输出评分和结构化建议，取代了原来的 SCUT 评分 + 独立 Qwen 分析两步。
"""
from __future__ import annotations

from beauty_pipeline.adapters.qwen_adapter import QwenAdapter
from beauty_pipeline.prompts.qwen_prompts import build_scoring_analysis_prompt
from beauty_pipeline.schemas import BeautyAdvice, BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Advisor:
    """医学美学分析+评分模块（基于 Qwen）"""

    def __init__(self, adapter: QwenAdapter):
        self.adapter = adapter

    def analyze(
        self,
        image_path: str,
        user_requirement: str | None = None,
    ) -> tuple[BeautyScore, BeautyAdvice]:
        """
        对图片进行医学美学分析，同时输出评分。
        一次 Qwen 推理同时完成：评分 + 优点 + 不足 + 改善建议 + 风险提示。

        Args:
            image_path: 图片路径
            user_requirement: 用户美容需求（可选）

        Returns:
            (BeautyScore, BeautyAdvice) 元组
        """
        prompt = build_scoring_analysis_prompt(user_requirement=user_requirement)

        logger.info("Qwen 评分+医学美学分析...")
        score, advice = self.adapter.score_and_analyze(image_path, prompt)
        logger.info(
            "完成，评分 %.2f (%s)，优点 %d 条，不足 %d 条，建议 %d 条",
            score.total_score,
            score.level,
            len(advice.strengths),
            len(advice.weaknesses),
            len(advice.medical_aesthetic_suggestions),
        )
        return score, advice
