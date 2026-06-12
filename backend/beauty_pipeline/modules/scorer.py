"""
Scorer 模块

封装 SCUT 评分功能，提供高层接口。
"""
from __future__ import annotations

import os

from beauty_pipeline.adapters.scut_adapter import SCUTAdapter
from beauty_pipeline.schemas import BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Scorer:
    """颜值评分模块"""

    def __init__(self, adapter: SCUTAdapter):
        self.adapter = adapter

    def score(self, image_path: str) -> BeautyScore:
        """
        对图片进行颜值评分。

        Args:
            image_path: 图片文件路径

        Returns:
            BeautyScore 评分结果
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片不存在: {image_path}")

        logger.info("评分中: %s", os.path.basename(image_path))
        result = self.adapter.score(image_path)
        logger.info("评分完成: %.4f (%s)", result.score, result.level)
        return result
