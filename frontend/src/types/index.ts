export interface ScoreResult {
  score: number;
  level: string;
  /** 多维度分项评分（后端返回） */
  dimensions?: ScoreDimension[];
  /** 维度分数的 key-value map（兼容旧版/备用） */
  dimension_scores?: Record<string, number>;
}

export interface ScoreDimension {
  name: string;
  score: number;
  level: string;
}

/** 前端用于展示的子维度评分（兼容两种来源） */
export interface SubDimensionScore {
  name: string;       // 英文名 or 中文名
  label: string;      // 中文显示名
  score: number;
  level?: string;
  description?: string;
  /** 前后对比：效果图分数 */
  generatedScore?: number;
  /** 前后对比：变化值 */
  delta?: number;
}

export type AdviceCategory = "skin" | "contour" | "color" | "proportion" | "other";

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

/** 评分对比数据 */
export interface ScoreComparison {
  before: ScoreResult;
  after: ScoreResult;
  delta: number;
}

export interface AnalysisResult {
  original_score: ScoreResult;
  /** 效果图评分（后端新版返回） */
  final_score?: ScoreResult;
  /** 向后兼容：效果图的原始格式分数 */
  generated_score?: ScoreResult;
  score_diff?: number;
  /** 完整的评分对比数据（后端直接提供） */
  score_comparison?: ScoreComparison;
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