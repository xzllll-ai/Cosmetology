"""
Qwen 提示词模板

集中管理所有发送给 Qwen 模型的提示词，方便调优和维护。
包含：首次分析 prompt、最终总结 prompt。
"""


def build_analysis_prompt(score: float, level: str, user_requirement: str | None = None) -> str:
    """
    构建首次医学美学分析的提示词。

    Args:
        score: SCUT 初始评分
        level: 评分等级
        user_requirement: 用户美容需求（可选）

    Returns:
        完整提示词字符串
    """
    requirement_block = ""
    if user_requirement:
        requirement_block = f"""
用户美容需求：
{user_requirement}

请在分析中特别关注与用户需求相关的方面。"""

    return f"""你是一位专业的医学美容顾问，具有丰富的皮肤科和整形外科知识。
请根据以下信息，对这张人脸照片进行专业的医学美学分析。

## 已知信息
- SCUT 颜值评分系统评分：{score:.2f} / 5.00
- 评分等级：{level}
{requirement_block}

## 请按以下格式输出分析结果

### 1. 当前优点
（列出 2-4 个面部优点，如五官比例、肤质、轮廓等）

### 2. 当前不足
（列出 2-4 个可改善的方面，注意措辞温和客观）

### 3. 医学美学改善建议
（从医学美容角度给出具体建议，包括但不限于：）
- 皮肤状态改善（如光子嫩肤、水光针等）
- 轮廓优化（如热玛吉、射频紧致等）
- 色泽改善（如美白管理、激光等）
- 其他适合的轻医美项目

### 4. 风险提示
（提醒用户注意的风险和注意事项）

## 重要要求
- 建议应使用"可考虑""建议咨询专业医生"等安全措辞
- 避免过度医疗化表达
- 不要推荐任何手术类项目
- 所有建议仅供参考，不构成医疗建议
- 措辞温和、专业、客观"""


def build_summary_prompt(
    original_score: float,
    original_level: str,
    generated_score: float,
    generated_level: str,
    score_diff: float,
    user_requirement: str,
    advice_summary: str = "",
) -> str:
    """
    构建最终变化总结的提示词。

    Args:
        original_score: 原图评分
        original_level: 原图等级
        generated_score: 效果图评分
        generated_level: 效果图等级
        score_diff: 分数变化
        user_requirement: 用户需求
        advice_summary: 之前的分析建议摘要（可选）

    Returns:
        完整提示词字符串
    """
    return f"""你是一位专业的医学美容顾问。请根据以下信息，总结用户美容前后的变化。

## 评分数据
- 原始评分：{original_score:.2f} / 5.00（等级：{original_level}）
- 生成后评分：{generated_score:.2f} / 5.00（等级：{generated_level}）
- 分数变化：{score_diff:+.2f}

## 用户需求
{user_requirement}

## 请按以下格式输出总结报告

### 1. 评分变化总结
（对比原始评分和生成后评分，说明分数变化的意义）

### 2. 视觉变化分析
（从医学美学角度分析生成图相较于原图可能的改善方向）

### 3. 是否符合用户需求
（评估生成效果是否满足用户的美容需求）

### 4. 后续建议
（给出进一步的医学美容建议和注意事项）

### 5. 温馨提示
（提醒用户效果图仅供参考，实际效果因人而异，建议咨询专业医生）

## 重要要求
- 措辞温和、专业
- 不要过度承诺效果
- 强调个体差异
- 所有建议仅供参考，不构成医疗建议
- 使用中文输出"""
