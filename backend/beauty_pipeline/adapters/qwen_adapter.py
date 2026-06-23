"""
Qwen3-VL 本地推理 Adapter

直接加载 Qwen3-VL 模型进行推理，不通过 HTTP API。
复用已有的模型权重和推理逻辑。
"""
from __future__ import annotations

import torch
from PIL import Image
from transformers import Qwen3VLForConditionalGeneration, AutoProcessor

from beauty_pipeline.schemas import BeautyAdvice, BeautyScore
from beauty_pipeline.utils.logging_utils import setup_logger

logger = setup_logger(__name__)


class QwenAdapter:
    """Qwen3-VL 本地推理适配器"""

    def __init__(
        self,
        model_path: str,
        device: str = "cuda:1",
        max_tokens: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.9,
    ):
        self.model_path = model_path
        self.device = device
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p
        self._model = None
        self._processor = None

    def _ensure_loaded(self):
        """懒加载模型"""
        if self._model is not None:
            return

        logger.info("加载 Qwen3-VL 模型: %s", self.model_path)
        logger.info("设备: %s", self.device)

        self._processor = AutoProcessor.from_pretrained(
            self.model_path, trust_remote_code=True
        )
        self._model = Qwen3VLForConditionalGeneration.from_pretrained(
            self.model_path,
            torch_dtype=torch.bfloat16,
            device_map=self.device,
            trust_remote_code=True,
        )
        self._model.eval()
        logger.info("Qwen3-VL 模型加载完成")

    def chat_with_image(
        self, image_path: str, text_prompt: str, max_tokens: int | None = None
    ) -> str:
        """发送图片+文本到模型，返回文本响应"""
        self._ensure_loaded()

        image = Image.open(image_path).convert("RGB")

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": text_prompt},
                ],
            }
        ]

        text = self._processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self._processor(
            text=[text], images=[image], return_tensors="pt", padding=True
        )
        inputs = inputs.to(self.device)

        with torch.no_grad():
            output_ids = self._model.generate(
                **inputs,
                max_new_tokens=max_tokens or self.max_tokens,
                do_sample=True,
                temperature=self.temperature,
                top_p=self.top_p,
            )

        generated_ids = output_ids[0][inputs.input_ids.shape[1]:]
        response = self._processor.decode(generated_ids, skip_special_tokens=True)
        logger.debug("Qwen 响应长度: %d 字符", len(response))
        return response

    def chat_text_only(self, text_prompt: str, max_tokens: int | None = None) -> str:
        """发送纯文本到模型，返回文本响应"""
        self._ensure_loaded()

        messages = [{"role": "user", "content": text_prompt}]

        text = self._processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self._processor(text=[text], return_tensors="pt", padding=True)
        inputs = inputs.to(self.device)

        with torch.no_grad():
            output_ids = self._model.generate(
                **inputs,
                max_new_tokens=max_tokens or self.max_tokens,
                do_sample=True,
                temperature=self.temperature,
                top_p=self.top_p,
            )

        generated_ids = output_ids[0][inputs.input_ids.shape[1]:]
        response = self._processor.decode(generated_ids, skip_special_tokens=True)
        logger.debug("Qwen 响应长度: %d 字符", len(response))
        return response

    def analyze(
        self, image_path: str, prompt: str
    ) -> BeautyAdvice:
        """
        调用 Qwen 对图片进行医学美学分析。

        Args:
            image_path: 图片路径
            prompt: 完整的分析提示词

        Returns:
            BeautyAdvice 结构化分析建议
        """
        logger.info("调用 Qwen 进行医学美学分析...")
        full_text = self.chat_with_image(image_path, prompt)

        # 尝试解析结构化字段（容错处理）
        advice = BeautyAdvice(full_text=full_text)
        advice.strengths = self._extract_list(full_text, "优点", "优势", "当前优点")
        advice.weaknesses = self._extract_list(
            full_text, "不足", "改善", "可改善", "当前不足"
        )
        advice.medical_aesthetic_suggestions = self._extract_list(
            full_text, "建议", "方案", "项目建议", "改善建议"
        )
        advice.risk_notes = self._extract_list(
            full_text, "风险", "注意", "安全", "风险提示"
        )

        return advice

    def score_and_analyze(
        self, image_path: str, prompt: str
    ) -> tuple[BeautyScore, BeautyAdvice]:
        """
        调用 Qwen 同时进行评分和医学美学分析（一次推理）。
        取代原来的 SCUT 评分 + Qwen 分析两步。

        Args:
            image_path: 图片路径
            prompt: 包含评分和分析要求的提示词

        Returns:
            (BeautyScore, BeautyAdvice) 元组
        """
        logger.info("调用 Qwen 进行评分+医学美学分析...")
        full_text = self.chat_with_image(image_path, prompt)

        # 从文本中提取评分（多维度）
        score = self._extract_score_multidim(full_text)

        # 解析结构化建议
        advice = BeautyAdvice(full_text=full_text)
        advice.strengths = self._extract_list(full_text, "优点", "优势", "当前优点")
        advice.weaknesses = self._extract_list(
            full_text, "不足", "改善", "可改善", "当前不足"
        )
        advice.medical_aesthetic_suggestions = self._extract_list(
            full_text, "建议", "方案", "项目建议", "改善建议"
        )
        advice.risk_notes = self._extract_list(
            full_text, "风险", "注意", "安全", "风险提示"
        )

        return score, advice

    def _extract_score_multidim(self, text: str) -> BeautyScore:
        """
        从 Qwen 多维度评分输出中解析总分和子维度分数。

        期望格式：
        总分: 4.16 / 5.00
        等级: 较高
        子维度评分：
        皮肤状态: 4.5 / 5.0（权重25%）毛孔较细腻
        轮廓线条: 4.0 / 5.0（权重25%）下颌线清晰
        ...
        """
        import re

        total_score = 3.0
        level = "中等"
        sub_dimensions = []

        lines = text.strip().split("\n")
        in_sub_dim = False

        # 子维度定义（名称 -> 权重）
        DIM_DEFS = {
            "皮肤状态": 0.25,
            "轮廓线条": 0.25,
            "五官精致度": 0.25,
            "色泽质感": 0.15,
            "比例协调": 0.10,
        }

        for line in lines:
            stripped = line.strip()

            # 解析总分
            if "总分" in stripped and "/" in stripped:
                match = re.search(r'([\d.]+)\s*/\s*5', stripped)
                if match:
                    try:
                        total_score = max(1.0, min(5.0, float(match.group(1))))
                    except ValueError:
                        pass

            # 解析等级
            if "等级" in stripped and ":" in stripped:
                level_text = stripped.split(":", 1)[1].strip()
                valid_levels = ["很高", "较高", "中等", "一般", "偏低"]
                for vl in valid_levels:
                    if vl in level_text:
                        level = vl
                        break

            # 进入子维度区域
            if "子维度评分" in stripped or "子维度" in stripped:
                in_sub_dim = True
                continue

            # 解析子维度分数
            if in_sub_dim:
                # 检测新章节（退出子维度区域）
                if stripped.startswith("###") or stripped.startswith("##"):
                    in_sub_dim = False
                    continue

                for dim_name, weight in DIM_DEFS.items():
                    if stripped.startswith(dim_name) or f"{dim_name}:" in stripped:
                        # 提取分数
                        score_match = re.search(r'([\d.]+)\s*/\s*5', stripped)
                        if score_match:
                            try:
                                dim_score = max(1.0, min(5.0, float(score_match.group(1))))
                            except ValueError:
                                dim_score = 3.0
                        else:
                            dim_score = 3.0

                        # 提取说明（括号内或冒号后）
                        desc_match = re.search(r'[（(]([^）)]+)[）)]', stripped)
                        description = desc_match.group(1).strip() if desc_match else ""

                        from beauty_pipeline.schemas import SubDimensionScore
                        sub_dimensions.append(SubDimensionScore(
                            name=dim_name,
                            score=round(dim_score, 1),
                            max_score=5.0,
                            weight=weight,
                            description=description,
                        ))
                        break

        # 如果没解析到等级，根据分数推断
        if level == "中等":
            level = (
                "很高" if total_score >= 4.0
                else "较高" if total_score >= 3.5
                else "中等" if total_score >= 3.0
                else "一般" if total_score >= 2.5
                else "偏低"
            )

        # 如果子维度为空，用默认值填充
        if not sub_dimensions:
            for dim_name, weight in DIM_DEFS.items():
                from beauty_pipeline.schemas import SubDimensionScore
                sub_dimensions.append(SubDimensionScore(
                    name=dim_name,
                    score=round(total_score, 1),
                    max_score=5.0,
                    weight=weight,
                    description="",
                ))

        logger.info("Qwen 多维度评分: %.2f (%s), 子维度 %d 个",
                     total_score, level, len(sub_dimensions))
        return BeautyScore(
            total_score=round(total_score, 2),
            level=level,
            sub_dimensions=sub_dimensions,
        )

    def _extract_score(self, text: str) -> BeautyScore:
        """从 Qwen 输出文本中解析评分和等级（兼容旧格式，内部转为多维度）"""
        score = self._extract_score_multidim(text)
        logger.info("Qwen 评分: %.2f (%s)", score.total_score, score.level)
        return score

    def summarize(self, prompt: str) -> str:
        """
        调用 Qwen 生成前后变化总结。

        Args:
            prompt: 完整的总结提示词

        Returns:
            总结文本
        """
        logger.info("调用 Qwen 生成前后变化总结...")
        return self.chat_text_only(prompt)

    @staticmethod
    def _extract_list(text: str, *keywords: str) -> list[str]:
        """从文本中尝试提取列表项（尽力解析，容错）"""
        lines = text.strip().split("\n")
        items: list[str] = []
        in_section = False

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # 检测是否进入了目标段落
            if any(kw in stripped for kw in keywords):
                in_section = True
                # 如果标题行本身有内容（如 "优点：xxx"），也提取
                for kw in keywords:
                    if kw in stripped:
                        after = stripped.split(kw, 1)[1].lstrip("：:").strip()
                        if after:
                            items.append(after)
                continue

            # 检测新段落标题（退出当前段落）
            if in_section and (stripped.endswith("：") or stripped.endswith(":")):
                in_section = False
                continue

            # 提取列表项
            if in_section:
                # 去掉列表符号
                cleaned = stripped.lstrip("•·-─—*①②③④⑤⑥⑦⑧⑨⑩1234567890.、)） ").strip()
                if cleaned:
                    items.append(cleaned)

        return items
