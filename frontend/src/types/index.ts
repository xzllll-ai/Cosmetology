export interface ScoreResult {
  total_score: number;
  level: string;
  sub_dimensions?: SubDimensionScore[];
}

export interface SubDimensionScore {
  name: string;
  label: string;
  score: number;
  max_score: number;
  weight: number;
  description: string;
}

export type AdviceCategory = "skin" | "contour" | "color" | "proportion" | "harmony" | "other";

export interface CategoryInfo {
  key: AdviceCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const ADVICE_CATEGORIES: Record<AdviceCategory, CategoryInfo> = {
  skin: { key: "skin", label: "皮肤状态", icon: "🧴", color: "text-rose-600 bg-rose-50", bgColor: "bg-rose-50 border-rose-200" },
  contour: { key: "contour", label: "轮廓线条", icon: "✏️", color: "text-violet-600 bg-violet-50", bgColor: "bg-violet-50 border-violet-200" },
  color: { key: "color", label: "色泽质感", icon: "🎨", color: "text-amber-600 bg-amber-50", bgColor: "bg-amber-50 border-amber-200" },
  proportion: { key: "proportion", label: "五官比例", icon: "📐", color: "text-sky-600 bg-sky-50", bgColor: "bg-sky-50 border-sky-200" },
  harmony: { key: "harmony", label: "整体协调", icon: "✨", color: "text-purple-600 bg-purple-50", bgColor: "bg-purple-50 border-purple-200" },
  other: { key: "other", label: "综合建议", icon: "💡", color: "text-gray-600 bg-gray-50", bgColor: "bg-gray-50 border-gray-200" },
};

export type AdvicePriority = "high" | "medium" | "low";

export interface CategorizedAdviceItem {
  id: string;
  text: string;
  category: AdviceCategory;
  priority: AdvicePriority;
  source: string;
}

export interface Advice {
  strengths: string[];
  weaknesses: string[];
  medical_aesthetic_suggestions: string[];
  risk_notes: string[];
  full_text: string;
}

export interface AnalysisResult {
  original_score: ScoreResult;
  generated_score?: ScoreResult;
  score_diff?: number;
  user_requirement: string;
  advice: Advice;
  summary: string;
  original_image_url: string;
  generated_image_url: string;
}

export interface TaskStatus {
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: string;
  result: AnalysisResult | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ProgressStep {
  id: number;
  label: string;
  icon: string;
  description: string;
  estimatedSeconds: number;
}
