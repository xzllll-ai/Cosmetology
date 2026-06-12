"""
Advisor 模块

封装 Qwen 医学美学分析功能，提供高层接口。
"""
from __future__ import annotations

from beauty_pipeline.adapters.qwen_adapter import QwenAdapter
from beauty_pipeline.prompts.qwen_prompts import build_analysis_prompt
from beauty_pipeline.schemas import BeautyAdvice, BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Advisor:
    """医学美学分析建议模块"""

    def __init__(self, adapter: QwenAdapter):
        self.adapter = adapter

    def analyze(
        self,
        image_path: str,
        score: BeautyScore,
        user_requirement: str | None = None,
    ) -> BeautyAdvice:
        """
        对图片进行医学美学分析，生成建议。

        Args:
            image_path: 图片路径
            score: SCUT 评分结果
            user_requirement: 用户美容需求（可选）

        Returns:
            BeautyAdvice 结构化建议
        """
        prompt = build_analysis_prompt(
            score=score.score,
            level=score.level,
            user_requirement=user_requirement,
        )

        logger.info("生成医学美学分析建议...")
        advice = self.adapter.analyze(image_path, score, prompt)
        logger.info("分析完成，提取到 %d 条优点, %d 条不足, %d 条建议",
                     len(advice.strengths), len(advice.weaknesses),
                     len(advice.medical_aesthetic_suggestions))
        return advice
