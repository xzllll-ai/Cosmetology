export interface ScoreResult {
  score: number;
  level: string;
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
