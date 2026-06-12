"""
Diffusion 模型提示词模板

集中管理 RealVision 扩散模型的正向/负向提示词。
综合用户需求和医学美学建议，生成自然真实的美容效果图。
"""


def build_diffusion_prompt(
    user_requirement: str,
    medical_suggestions: list[str] | None = None,
) -> tuple[str, str]:
    """
    构建扩散模型的正向和负向提示词。

    Args:
        user_requirement: 用户美容需求
        medical_suggestions: Qwen 给出的医学美学建议列表

    Returns:
        (positive_prompt, negative_prompt) 元组
    """
    # 基础正向提示词 —— 强调自然、真实、身份保持
    base_positive = (
        "natural realistic medical aesthetic enhancement, "
        "professional portrait photography, "
        "preserve facial identity and structure, "
        "subtle natural skin improvement, "
        "realistic skin texture, "
        "natural lighting, high quality, detailed"
    )

    # 根据用户需求添加具体方向
    requirement_keywords = _map_requirement_to_keywords(user_requirement)

    # 根据医学建议添加关键词
    suggestion_keywords = _map_suggestions_to_keywords(medical_suggestions or [])

    # 组合正向提示词
    parts = [base_positive]
    if requirement_keywords:
        parts.append(requirement_keywords)
    if suggestion_keywords:
        parts.append(suggestion_keywords)

    positive_prompt = ", ".join(parts)

    # 负向提示词 —— 避免不自然的效果
    negative_prompt = (
        "over-smoothed skin, plastic face, unrealistic beauty filter, "
        "changed identity, distorted face, bad anatomy, "
        "extra fingers, deformed eyes, deformed face, "
        "overexposed, low quality, blurry, "
        "cartoon, anime, painting, illustration, "
        "heavy makeup, exaggerated features, "
        "uncanny valley, artificial look"
    )

    return positive_prompt, negative_prompt


def _map_requirement_to_keywords(requirement: str) -> str:
    """将用户需求映射为扩散模型关键词"""
    keyword_map = {
        "紧致": "skin tightening, firm skin, lifted facial contour",
        "法令纹": "reduced nasolabial folds, smooth skin around mouth",
        "轮廓": "defined facial contour, sharp jawline, v-shaped face",
        "白净": "bright even skin tone, fair complexion, radiant skin",
        "细腻": "refined skin texture, smooth pores, delicate skin",
        "美白": "brightened skin tone, reduced pigmentation, luminous skin",
        "祛痘": "clear skin, reduced blemishes, even skin texture",
        "抗衰": "youthful appearance, anti-aging, reduced fine lines",
        "皱纹": "reduced wrinkles, smooth forehead, youthful skin",
        "眼袋": "reduced eye bags, fresh under-eye area",
        "黑眼圈": "reduced dark circles, bright eye area",
        "毛孔": "minimized pores, refined skin texture",
        "瘦脸": "slim face, defined jawline, v-line face",
        "丰唇": "natural fuller lips, defined lip contour",
        "隆鼻": "refined nose contour, balanced nose shape",
    }

    matched = []
    for cn_key, en_value in keyword_map.items():
        if cn_key in requirement:
            matched.append(en_value)

    if matched:
        return ", ".join(matched)

    # 如果没有匹配到关键词，用通用描述
    return "natural beautification, improved appearance"


def _map_suggestions_to_keywords(suggestions: list[str]) -> str:
    """将医学美学建议映射为扩散模型关键词"""
    keyword_map = {
        "光子嫩肤": "IPL photorejuvenation result, even skin tone",
        "水光针": "hydrated glowing skin, dewy complexion",
        "热玛吉": "thermage lifting effect, tightened skin",
        "射频": "RF skin tightening, firm contour",
        "美白": "brightened complexion, reduced melanin",
        "激光": "laser skin resurfacing, refined texture",
        "紧致": "skin firming, lifted contour",
        "补水": "deeply hydrated skin, plump complexion",
    }

    matched = []
    for suggestion in suggestions:
        for cn_key, en_value in keyword_map.items():
            if cn_key in suggestion and en_value not in matched:
                matched.append(en_value)

    return ", ".join(matched[:3])  # 最多取 3 个，避免提示词过长
