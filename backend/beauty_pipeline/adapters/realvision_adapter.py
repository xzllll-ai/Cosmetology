"""
RealVision Diffusion 本地推理 Adapter

直接加载 RealVisXL V5.0 模型进行推理，不通过 HTTP API。
复用已有的模型权重和推理逻辑。
"""
from __future__ import annotations

import os

import torch
from PIL import Image
from diffusers import AutoPipelineForImage2Image

from beauty_pipeline.schemas import GeneratedResult
from beauty_pipeline.utils.image_io import ensure_dir, load_image, save_image
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class RealVisionAdapter:
    """RealVisXL 扩散模型本地推理适配器"""

    def __init__(
        self,
        model_path: str,
        device: str = "cuda:5",
        strength: float = 0.35,
        guidance_scale: float = 7.5,
        steps: int = 50,
        seed: int = -1,
    ):
        self.model_path = model_path
        self.device = device
        self.strength = strength
        self.guidance_scale = guidance_scale
        self.steps = steps
        self.seed = seed
        self._pipe = None

    def _ensure_loaded(self):
        """懒加载模型"""
        if self._pipe is not None:
            return

        logger.info("加载 RealVisXL 模型: %s", self.model_path)
        logger.info("设备: %s", self.device)

        self._pipe = AutoPipelineForImage2Image.from_pretrained(
            self.model_path,
            torch_dtype=torch.float32,
            use_safetensors=True,
        )
        self._pipe.to(self.device)
        logger.info("RealVisXL 模型加载完成")

    @staticmethod
    def _resize_keep_ratio(image: Image.Image, target_size: int = 1536):
        """保持比例缩放，用黑边填充到正方形。"""
        w, h = image.size
        scale = target_size / max(w, h)
        new_w, new_h = int(w * scale), int(h * scale)
        image = image.resize((new_w, new_h), Image.LANCZOS)

        canvas = Image.new("RGB", (target_size, target_size), (0, 0, 0))
        offset_x = (target_size - new_w) // 2
        offset_y = (target_size - new_h) // 2
        canvas.paste(image, (offset_x, offset_y))
        return canvas, (offset_x, offset_y, new_w, new_h)

    def generate(
        self,
        image_path: str,
        prompt: str,
        negative_prompt: str,
        output_path: str,
        strength: float | None = None,
        seed: int | None = None,
    ) -> GeneratedResult:
        """
        生成美容效果图。

        Args:
            image_path: 原始图片路径
            prompt: 正向提示词
            negative_prompt: 负向提示词
            output_path: 输出图片路径
            strength: 变化强度（覆盖默认值）
            seed: 随机种子（覆盖默认值）

        Returns:
            GeneratedResult 包含生成图片路径和使用参数
        """
        self._ensure_loaded()

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片不存在: {image_path}")

        ensure_dir(os.path.dirname(output_path) or ".")

        use_strength = strength if strength is not None else self.strength
        use_seed = seed if seed is not None else self.seed

        # 加载并预处理图片
        init_image = load_image(image_path)
        orig_w, orig_h = init_image.size
        init_image, (ox, oy, nw, nh) = self._resize_keep_ratio(init_image, 1536)

        # 设置随机种子
        generator = None
        if use_seed >= 0:
            generator = torch.Generator(device=self.device).manual_seed(use_seed)

        logger.info("生成效果图 (strength=%.2f, steps=%d)...", use_strength, self.steps)
        logger.debug("生成 prompt: %s", prompt[:200])

        # 推理
        result = self._pipe(
            prompt=prompt,
            image=init_image,
            strength=use_strength,
            guidance_scale=self.guidance_scale,
            num_inference_steps=self.steps,
            generator=generator,
        )

        # 裁剪回原始比例
        output_image = result.images[0]
        output_image = output_image.crop((ox, oy, ox + nw, oy + nh))
        output_image = output_image.resize((orig_w, orig_h), Image.LANCZOS)

        save_image(output_image, output_path)
        logger.info("效果图已保存: %s", output_path)

        return GeneratedResult(
            generated_image_path=output_path,
            prompt_used=prompt,
            negative_prompt_used=negative_prompt,
            raw_result={
                "strength": use_strength,
                "steps": self.steps,
                "seed": use_seed,
                "guidance_scale": self.guidance_scale,
            },
        )
