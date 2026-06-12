"""
Generator 模块

封装 RealVision 扩散模型生成功能，提供高层接口。
"""
from __future__ import annotations

import os

from beauty_pipeline.adapters.realvision_adapter import RealVisionAdapter
from beauty_pipeline.prompts.diffusion_prompts import build_diffusion_prompt
from beauty_pipeline.schemas import BeautyAdvice, GeneratedResult
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Generator:
    """效果图生成模块"""

    def __init__(self, adapter: RealVisionAdapter):
        self.adapter = adapter

    def generate(
        self,
        image_path: str,
        user_requirement: str,
        advice: BeautyAdvice | None = None,
        output_path: str = "generated.jpg",
    ) -> GeneratedResult:
        """
        生成美容效果图。

        Args:
            image_path: 原始图片路径
            user_requirement: 用户美容需求
            advice: Qwen 分析建议（可选，用于优化生成 prompt）
            output_path: 输出图片路径

        Returns:
            GeneratedResult 生成结果
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片不存在: {image_path}")

        # 构建扩散模型提示词
        positive_prompt, negative_prompt = build_diffusion_prompt(
            user_requirement=user_requirement,
            medical_suggestions=advice.medical_aesthetic_suggestions if advice else None,
        )

        logger.info("生成美容效果图...")
        result = self.adapter.generate(
            image_path=image_path,
            prompt=positive_prompt,
            negative_prompt=negative_prompt,
            output_path=output_path,
        )

        return result
