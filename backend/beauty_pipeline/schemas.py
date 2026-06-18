"""
Beauty Pipeline 数据结构定义

所有模块间的数据传递都通过这些结构完成，保证输入输出清晰、可追踪、易调试。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class BeautyInput:
    """Pipeline 输入"""
    image_path: str
    user_requirement: str | None = None


@dataclass
class BeautyScore:
    """Qwen 评分结果"""
    score: float
    level: str
    raw_result: dict = field(default_factory=dict)


@dataclass
class BeautyAdvice:
    """Qwen 医学美学分析建议"""
    strengths: list[str] = field(default_factory=list)
    weaknesses: list[str] = field(default_factory=list)
    medical_aesthetic_suggestions: list[str] = field(default_factory=list)
    risk_notes: list[str] = field(default_factory=list)
    full_text: str = ""


@dataclass
class GeneratedResult:
    """RealVision 生成结果"""
    generated_image_path: str = ""
    prompt_used: str = ""
    negative_prompt_used: str = ""
    raw_result: dict = field(default_factory=dict)


@dataclass
class BeautyPipelineResult:
    """Pipeline 最终输出"""
    original_image_path: str = ""
    generated_image_path: str = ""
    original_score: BeautyScore | None = None
    generated_score: BeautyScore | None = None
    advice: BeautyAdvice | None = None
    summary: str = ""
    user_requirement: str = ""
