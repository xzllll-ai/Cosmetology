"""
Beauty Pipeline 数据结构定义

所有模块间的数据传递都通过这些结构完成，保证输入输出清晰、可追踪、易调试。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, List


@dataclass
class SubDimensionScore:
    """子维度评分"""
    name: str = ""
    score: float = 0.0
    max_score: float = 5.0
    weight: float = 0.0
    description: str = ""
    evidence: str = ""


@dataclass
class BeautyScore:
    """
    美学评分结果

    Attributes:
        total_score: 总分（1.0-5.0），5个维度的加权平均
        level: 等级（很高/较高/中等/一般/偏低）
        sub_dimensions: 5个子维度详细评分
        raw_result: 原始 LLM 输出
    """
    total_score: float = 0.0
    level: str = "中等"
    sub_dimensions: List[SubDimensionScore] = field(default_factory=list)
    raw_result: dict = field(default_factory=dict)


@dataclass
class AdviceItem:
    """单条建议"""
    text: str = ""
    category: str = ""          # skin / contour / color / proportion / harmony / other
    priority: str = "medium"    # high / medium / low
    is_user_requested: bool = False
    target_feature: str = ""    # 针对的具体部位，如"眼睛""轮廓"


@dataclass
class BeautyAdvice:
    """医学美学分析建议"""
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    medical_aesthetic_suggestions: List[str] = field(default_factory=list)
    risk_notes: List[str] = field(default_factory=list)
    full_text: str = ""
    advice_items: List[AdviceItem] = field(default_factory=list)


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
    score_diff: float | None = None
    advice: BeautyAdvice | None = None
    summary: str = ""
    user_requirement: str = ""
