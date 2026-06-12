"""
SCUT 评分模型 Adapter

封装已有的 SCUT-FBP5500 ResNet-18 评分模型，只负责加载和推理。
不改变原有模型逻辑，仅提供统一的调用接口。
"""
from __future__ import annotations

import os
import sys

import torch
import torchvision.transforms as transforms
from PIL import Image

from beauty_pipeline.schemas import BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)

# 将 SCUT 模型目录加入 path（复用已有 Nets.py）
_SCUT_PYTORCH_DIR = os.path.join(
    os.path.dirname(__file__),
    "..", "..",
    "aesthetic", "SCUT-Training",
    "SCUT-FBP5500-Database-Release",
    "trained_models_for_pytorch",
)
if os.path.isdir(_SCUT_PYTORCH_DIR):
    sys.path.insert(0, os.path.abspath(_SCUT_PYTORCH_DIR))

import Nets  # type: ignore  # noqa: E402


def score_to_level(score: float) -> str:
    """评分转等级（与原项目保持一致）"""
    if score >= 4.0:
        return "很高"
    elif score >= 3.5:
        return "较高"
    elif score >= 3.0:
        return "中等"
    elif score >= 2.5:
        return "一般"
    else:
        return "偏低"


class SCUTAdapter:
    """SCUT 评分模型适配器"""

    def __init__(self, model_path: str, device: str = "cuda:0"):
        self.model_path = model_path
        self.device = device
        self._model = None
        self._transform = None

    def _ensure_loaded(self):
        """懒加载模型"""
        if self._model is not None:
            return

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"SCUT 模型文件不存在: {self.model_path}")

        logger.info("加载 SCUT 评分模型: %s", self.model_path)
        self._model = Nets.ResNet(
            block=Nets.BasicBlock, layers=[2, 2, 2, 2], num_classes=1
        ).to(self.device)
        ckpt = torch.load(self.model_path, weights_only=False, map_location=self.device)
        self._model.load_state_dict(ckpt["state_dict"])
        self._model.eval()

        self._transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225]),
        ])
        logger.info("SCUT 模型加载完成")

    def score(self, image_path: str) -> BeautyScore:
        """
        对单张图片进行颜值评分。

        Args:
            image_path: 图片文件路径

        Returns:
            BeautyScore 包含评分值和等级
        """
        self._ensure_loaded()

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"图片不存在: {image_path}")

        img = Image.open(image_path).convert("RGB")
        tensor = self._transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            raw_score = self._model(tensor).item()

        level = score_to_level(raw_score)
        logger.debug("SCUT 评分完成: %.4f (%s) - %s", raw_score, level, image_path)

        return BeautyScore(
            score=round(raw_score, 4),
            level=level,
            raw_result={"raw_score": raw_score},
        )
