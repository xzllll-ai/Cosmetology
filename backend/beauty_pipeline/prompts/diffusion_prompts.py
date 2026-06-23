"""
Diffusion 模型提示词模板

集中管理 RealVision 扩散模型的正向/负向提示词。
核心改进：基于用户需求精准定位改变区域，只改用户指定的地方，符合东方审美。
"""

# 子维度 → 描述映射（用于提取用户具体需求）
FEATURE_DESCRIPTIONS = {
    "眼睛": "眼型自然放大、眼神明亮有神",
    "鼻子": "鼻梁挺拔、鼻尖精致、山根清晰",
    "嘴唇": "唇珠饱满、唇峰明显、嘴角上扬",
    "脸型": "下颌线清晰紧致、面部轮廓流畅",
    "皮肤": "肤质细腻光滑、肤色均匀透亮",
    "额头": "额头饱满圆润、发际线自然",
    "苹果肌": "苹果肌饱满提升、面中立体感强",
    "法令纹": "法令纹减淡、面部平整年轻化",
}

# 关键词到特征区域的映射
KEYWORD_TO_REGION = {
    "大眼睛": "眼睛", "大眼": "眼睛", "双眼皮": "眼睛", "眼距": "眼睛",
    "高鼻梁": "鼻子", "鼻梁": "鼻子", "鼻尖": "鼻子", "山根": "鼻子",
    "嘟嘟唇": "嘴唇", "厚唇变薄": "嘴唇", "唇珠": "嘴唇",
    "小V脸": "脸型", "下巴": "脸型", "下颌线": "脸型", "脸型": "脸型",
    "白净": "皮肤", "美白": "皮肤", "去斑": "皮肤", "毛孔": "皮肤",
    "额头窄": "额头", "发际线": "额头",
    "苹果肌": "苹果肌", "面中": "苹果肌",
    "法令纹": "法令纹", "皱纹": "法令纹",
}


def build_diffusion_prompt_from_analysis(
    user_requirement: str,
    analysis_full_text: str,
) -> tuple[str, str]:
    """
    根据 Qwen 的完整分析文本 + 用户需求构建扩散模型的正向和负向提示词。

    核心策略：
    1. 从用户需求中提取具体要改变的部位和效果
    2. 从 Qwen 分析中提取医学美学建议作为补充
    3. 只对用户指定的部位做调整，其他区域保持原貌
    4. 强调东方审美：柔和过渡、自然和谐、不改变五官比例

    Args:
        user_requirement: 用户美容需求
        analysis_full_text: Qwen 分析的完整文本

    Returns:
        (positive_prompt, negative_prompt) 元组
    """
    # 1. 从用户需求中提取目标特征
    target_features = _extract_target_features(user_requirement)

    # 2. 从 Qwen 分析中提取改善建议
    suggestions = _extract_suggestions_for_diffusion(analysis_full_text)

    # 3. 构建正向提示词
    positive_prompt = _build_positive_prompt(target_features, suggestions)

    # 4. 构建负向提示词
    negative_prompt = _build_negative_prompt()

    return positive_prompt, negative_prompt


def _extract_target_features(user_requirement: str) -> list[dict]:
    """
    从用户需求中提取具体的美容目标。

    返回格式: [{"region": "眼睛", "effect": "变大变亮", "strength": 0.8}, ...]
    """
    features = []
    requirement = user_requirement

    # 检测是否包含明确的改变指令
    has_change_command = any(kw in requirement for kw in [
        "让", "变得", "改成", "换成", "调成", "修改为", "变成", "变大", "变小",
        "加宽", "收窄", "抬高", "降低", "拉长", "缩短", "加深", "提亮", "增厚",
        "缩小", "修整", "优化", "调整", "改善", "美化"
    ])

    if not has_change_command:
        # 没有明确改变指令时，不做任何额外改变，只做自然美化
        return []

    # 遍历关键词映射表
    for keyword, region in KEYWORD_TO_REGION.items():
        if keyword in requirement:
            effect = FEATURE_DESCRIPTIONS.get(region, f"{region}优化")
            # 根据上下文判断强度
            strength = 0.6
            if "很大" in requirement or "非常明显" in requirement:
                strength = 0.9
            elif "稍微" in requirement or "微调" in requirement:
                strength = 0.4
            features.append({"region": region, "effect": effect, "strength": strength})

    # 如果没有任何匹配的特征，用默认的自然美化
    if not features:
        features = [
            {"region": "综合", "effect": "整体自然美化，肌肤质感提升", "strength": 0.5}
        ]

    return features


def _build_positive_prompt(
    target_features: list[dict],
    suggestions: str,
) -> str:
    """
    构建正向提示词。

    核心原则：
    - 明确指定保留哪些区域不变（face, hair, ears, neck）
    - 明确指定需要调整的区域和方式
    - 强调东方审美：柔和、自然、和谐
    """
    parts = [
        "natural realistic medical aesthetic enhancement,",
        "professional portrait photography,",
        "preserve facial identity and structure,",
        "realistic skin texture, natural lighting, high quality, detailed,",
        "eastern asian facial aesthetics, soft transitions, natural harmony,",
        "only modify targeted areas as requested, keep original face shape intact,",
    ]

    # 添加目标特征
    if target_features:
        feature_descs = []
        for feat in target_features:
            strength = int(feat["strength"] * 100)
            feature_descs.append(f"{feat['region']}{feat['effect']}(+{strength}%)")
        parts.append("beautified version based on professional analysis: " + "; ".join(feature_descs))

    # 添加 Qwen 建议作为补充
    if suggestions:
        parts.append(f"based on professional beauty analysis: {suggestions}")

    return "\n".join(parts)


def _build_negative_prompt() -> str:
    """构建负向提示词，阻止不希望出现的效果。"""
    return (
        "over-smoothed skin, plastic face, unrealistic beauty filter, "
        "changed identity, distorted face, bad anatomy, "
        "extra fingers, deformed eyes, deformed nose, deformed lips, "
        "uncanny valley, artificial look, anime style, cartoon style, "
        "heavy makeup, exaggerated features, "
        "overly sharp jawline, extreme v-shape, plastic surgery look, "
        "mismatched eye size, uneven skin tone, patchy skin, "
        "distorted proportions, altered facial ratios, "
        "stereotypical east asian beauty, one-size-fits-all beauty standard, "
        "blurred background, low quality, blurry, noisy, "
        "cartoon, anime, painting, illustration, "
        "facial symmetry forced, over-edited, filtered appearance"
    )


def _extract_suggestions_for_diffusion(analysis_text: str) -> str:
    """
    从 Qwen 分析文本中提取适合扩散模型的关键词。
    优先提取"医学美学改善建议"部分的内容。
    """
    lines = analysis_text.strip().split("\n")
    in_suggestion_section = False
    suggestion_lines = []

    for line in lines:
        stripped = line.strip()

        # 检测改善建议段落
        if "医学美学改善建议" in stripped or "改善建议" in stripped:
            in_suggestion_section = True
            continue

        # 退出段落（遇到下一个标题）
        if in_suggestion_section and (stripped.startswith("###") or stripped.startswith("##")):
            if "医学美学改善建议" not in stripped and "改善建议" not in stripped:
                in_suggestion_section = False
            continue

        if in_suggestion_section:
            # 清洗列表符号
            cleaned = stripped.lstrip("•·-─—*①②③④⑤⑥⑦⑧⑨⑩1234567890.、)） ").strip()
            if cleaned and len(cleaned) > 2:
                suggestion_lines.append(cleaned)

    if suggestion_lines:
        # 取前 3 条最核心的建议
        core = suggestion_lines[:3]
        return "; ".join(core)

    # 降级：从全文提取包含关键词的句子
    keywords = ["建议", "改善", "紧致", "美白", "提升", "轮廓", "补水", "抗衰"]
    fallback = []
    for line in lines:
        for kw in keywords:
            if kw in line and len(line.strip()) > 5:
                fallback.append(line.strip())
                break
        if len(fallback) >= 3:
            break

    if fallback:
        return "; ".join(fallback)

    # 最终降级
    return "skin improvement, natural beautification"
