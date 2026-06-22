import type { ProgressStep } from "@/types";

export const PIPELINE_STEPS: ProgressStep[] = [
  {
    id: 1,
    label: "Qwen 评分 + 医学美学分析",
    icon: "🔍",
    description: "AI 通过多维度评估面部美学特征，并生成结构化分析建议",
    estimatedSeconds: 90,
  },
  {
    id: 2,
    label: "AI 美容效果图生成",
    icon: "🎨",
    description: "基于分析结果，用 RealVision 模型生成自然美容效果图",
    estimatedSeconds: 90,
  },
  {
    id: 3,
    label: "变化总结与报告生成",
    icon: "📝",
    description: "对比原始照片与效果图，生成详细的医学美容变化总结",
    estimatedSeconds: 30,
  },
];
