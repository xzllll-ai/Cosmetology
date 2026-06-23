import type { ProgressStep } from "@/types";

export const PIPELINE_STEPS: ProgressStep[] = [
  {
    id: 1,
    label: "Qwen 评分与医学美学分析",
    icon: "🔍",
    description: "AI 通过多维度评估面部美学特征，并生成结构化分析建议",
    estimatedSeconds: 90,
  },
  {
    id: 2,
    label: "RealVision 美容效果图生成",
    icon: "🎨",
    description: "基于用户需求精准优化，只改变用户指定区域，符合东方审美",
    estimatedSeconds: 90,
  },
  {
    id: 3,
    label: "Qwen AI 效果图二次评分",
    icon: "⭐",
    description: "对生成图进行5维度独立评分，实现前后对比",
    estimatedSeconds: 60,
  },
  {
    id: 4,
    label: "变化总结与报告生成",
    icon: "📝",
    description: "对比原始照片与效果图，生成详细的医学美容变化总结",
    estimatedSeconds: 30,
  },
];
