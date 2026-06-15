"""
Scorer 模块

封装 Qwen 评分功能，提供高层接口。
注：原 SCUT 评分已废弃，评分现在由 Qwen 在 score_and_analyze 中一起完成。
这里保留模块以备单独评分场景使用。
"""
from __future__ import annotations

import os

from beauty_pipeline.adapters.qwen_adapter import QwenAdapter
from beauty_pipeline.schemas import BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Scorer:
    """美学评分模块（基于 Qwen）"""

    def __init__(self, adapter: QwenAdapter):
        self.adapter = adapter

    def score(self, image_path: str) -> BeautyScore:
        """
        对图片进行美学评分（仅评分，不做分析）。

        Args:
            image_path: 图片文件路径

        Returns:
            BeautyScore 评分结果
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片不存在: {image_path}")

        logger.info("Qwen 评分中: %s", os.path.basename(image_path))
        from beauty_pipeline.prompts.qwen_prompts import build_scoring_analysis_prompt
        prompt = build_scoring_analysis_prompt()
        score, _ = self.adapter.score_and_analyze(image_path, prompt)
        logger.info("评分完成: %.2f (%s)", score.score, score.level)
        return score
