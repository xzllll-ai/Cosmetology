"""
Beauty Pipeline Configuration

集中管理所有模型路径、设备、推理参数等配置。
更换模型/微调权重时只需修改此处配置。
"""
from dataclasses import dataclass


@dataclass
class BeautyPipelineConfig:
    """Pipeline 总配置"""

    # ---- Qwen3-VL 模型 ----
    qwen_model_path: str = (
        "/apps/users/xzl/model_local/qwen3vl/models/Qwen3-VL-8B-Instruct"
    )
    qwen_device: str = "cuda:5"
    qwen_max_tokens: int = 2048
    qwen_temperature: float = 0.7
    qwen_top_p: float = 0.9

    # ---- RealVision Diffusion 模型 ----
    realvision_model_path: str = (
        "/apps/users/xzl/model_local/diffusion/models/RealVisXL_V5.0"
    )
    realvision_device: str = "cuda:5"
    realvision_strength: float = 0.35
    realvision_guidance_scale: float = 7.5
    realvision_steps: int = 70
    realvision_seed: int = -1

    # ---- 输出 ----
    output_dir: str = "outputs"

    # ---- 日志 ----
    log_level: str = "INFO"
