"""
Diffusion 模型提示词模板

集中管理 RealVision 扩散模型的正向/负向提示词。
将 Qwen 的完整医学美学分析作为 prompt 输入，帮助 RealVision 生成更精准的效果图。
"""


def build_diffusion_prompt_from_analysis(
    user_requirement: str,
    analysis_full_text: str,
) -> tuple[str, str]:
    """
    根据 Qwen 的完整分析文本构建扩散模型的正向和负向提示词。

    Args:
        user_requirement: 用户美容需求
        analysis_full_text: Qwen 分析的完整文本（包含优点、不足、建议等）

    Returns:
        (positive_prompt, negative_prompt) 元组
    """
    # 从分析文本中提取关键信息
    suggestions = _extract_suggestions_for_diffusion(analysis_full_text)

    positive_prompt = (
        f"natural realistic medical aesthetic enhancement, "
        f"professional portrait photography, "
        f"preserve facial identity and structure, "
        f"realistic skin texture, natural lighting, high quality, detailed, "
        f"beautified version based on professional analysis: {suggestions}"
    )

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
