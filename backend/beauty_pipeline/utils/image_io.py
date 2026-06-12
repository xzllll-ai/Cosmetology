"""
图片 IO 工具

提供图片读取、保存、base64 编解码等公共功能。
"""
from __future__ import annotations

import base64
import io
import os
from pathlib import Path

from PIL import Image


SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}


def ensure_dir(path: str) -> str:
    """确保目录存在，不存在则创建"""
    os.makedirs(path, exist_ok=True)
    return path


def load_image(path: str) -> Image.Image:
    """加载图片并转为 RGB"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"图片不存在: {path}")
    return Image.open(path).convert("RGB")


def save_image(image: Image.Image, path: str, quality: int = 95) -> str:
    """保存图片到指定路径，自动根据扩展名选择格式和质量"""
    ensure_dir(os.path.dirname(path) or ".")
    ext = Path(path).suffix.lower()
    if ext in (".jpg", ".jpeg"):
        image.save(path, quality=quality, subsampling=0)
    elif ext == ".webp":
        image.save(path, quality=quality)
    else:
        image.save(path)
    return path


def image_to_base64(image: Image.Image, fmt: str = "PNG") -> str:
    """PIL Image -> base64 data URL"""
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode()
    mime = "image/png" if fmt.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"


def file_to_base64(path: str) -> str:
    """文件路径 -> base64 data URL"""
    ext = Path(path).suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".bmp": "image/bmp",
        ".webp": "image/webp", ".tiff": "image/tiff",
    }
    mime = mime_map.get(ext, "image/png")
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    return f"data:{mime};base64,{b64}"


def base64_to_image(data_url: str) -> Image.Image:
    """base64 data URL -> PIL Image"""
    if data_url.startswith("data:"):
        _, b64 = data_url.split(",", 1)
        img_bytes = base64.b64decode(b64)
    else:
        img_bytes = base64.b64decode(data_url)
    return Image.open(io.BytesIO(img_bytes)).convert("RGB")


def validate_image_path(path: str) -> None:
    """校验图片路径"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"图片文件不存在: {path}")
    ext = Path(path).suffix.lower()
    if ext not in SUPPORTED_EXTS:
        raise ValueError(f"不支持的图片格式: {ext}，支持: {SUPPORTED_EXTS}")
