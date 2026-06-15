"""
Generator 模块

封装 RealVision 扩散模型生成功能。
将 Qwen 的完整分析作为 prompt 喂给 RealVision，帮助其生成更精准的美容效果图。
"""
from __future__ import annotations

import os

from beauty_pipeline.adapters.realvision_adapter import RealVisionAdapter
from beauty_pipeline.prompts.diffusion_prompts import build_diffusion_prompt_from_analysis
from beauty_pipeline.schemas import GeneratedResult
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class Generator:
    """效果图生成模块（基于 RealVision + Qwen 分析 prompt）"""

    def __init__(self, adapter: RealVisionAdapter):
        self.adapter = adapter

    def generate(
        self,
        image_path: str,
        user_requirement: str,
        analysis_full_text: str,
        output_path: str = "generated.jpg",
    ) -> GeneratedResult:
        """
        生成美容效果图。
        Qwen 的分析文本会作为 prompt 喂给 RealVision，引导其生成方向。

        Args:
            image_path: 原始图片路径
            user_requirement: 用户美容需求
            analysis_full_text: Qwen 输出的完整分析文本
            output_path: 输出图片路径

        Returns:
            GeneratedResult 生成结果
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片不存在: {image_path}")

        # 基于 Qwen 的完整分析构建扩散模型 prompt
        positive_prompt, negative_prompt = build_diffusion_prompt_from_analysis(
            user_requirement=user_requirement,
            analysis_full_text=analysis_full_text,
        )

        logger.info("RealVision 生成美容效果图（使用 Qwen 分析作为 prompt）...")
        result = self.adapter.generate(
            image_path=image_path,
            prompt=positive_prompt,
            negative_prompt=negative_prompt,
            output_path=output_path,
        )

        # 把分析文本一并保存到 raw_result 方便排查
        result.raw_result["qwen_analysis_used"] = analysis_full_text[:2000]
        return result
