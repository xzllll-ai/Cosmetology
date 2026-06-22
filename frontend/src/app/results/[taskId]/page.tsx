"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTaskStatus } from "@/lib/api";
import { TaskStatus, AnalysisResult } from "@/types";
import ProgressTracker from "@/components/ProgressTracker";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScorePanel from "@/components/ScorePanel";
import AdviceCard from "@/components/AdviceCard";
import BeforeAfterCompare from "@/components/BeforeAfterCompare";
import SummaryReport from "@/components/SummaryReport";
import ActionBar from "@/components/ActionBar";
import UserRequirement from "@/components/UserRequirement";
import { parseAdvice, buildSubDimensionScores } from "@/lib/analysisParser";
import type { SubDimensionScore } from "@/types";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // 任务完成后延迟 2 秒再展示结果，让用户看到全绿钩
  useEffect(() => {
    if (task?.status === "completed" && !showResults) {
      const timer = setTimeout(() => setShowResults(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [task?.status, showResults]);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getTaskStatus(taskId);
      setTask(data);
      if (data.status === "failed") {
        setError(data.error || "分析失败");
      }
    } catch {
      setError("无法获取任务状态");
    }
  }, [taskId]);

  // 轮询，直到任务完成或失败才停止
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      setTask((prev) => {
        if (prev?.status === "completed" || prev?.status === "failed") {
          clearInterval(interval);
          return prev;
        }
        fetchStatus();
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Hooks must be BEFORE early returns — always same number every render
  const safeResult = task?.result as AnalysisResult | undefined;
  const { items: parsedItems, categories, categoryCounts } = useMemo(
    () => safeResult ? parseAdvice(safeResult.advice) : { items: [], categories: [], categoryCounts: {} as Record<string, number> },
    [safeResult?.advice]
  );

  // 子维度：优先用后端返回的真实维度，否则回退到估算
  const { dimensions: subDimensions } = useMemo(
    () => safeResult
      ? buildSubDimensionScores(
          safeResult.original_score,
          safeResult.final_score ?? safeResult.generated_score,
        )
      : { dimensions: [] as SubDimensionScore[] },
    [
      safeResult?.original_score,
      safeResult?.final_score,
      safeResult?.generated_score,
    ],
  );

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6" role="alert">
        <div className="text-6xl">😵</div>
        <h2 className="text-2xl font-bold text-gray-800">分析失败</h2>
        <p className="text-gray-500">{error}</p>
        <button
          className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition"
          onClick={() => router.push("/")}
        >
          返回重试
        </button>
      </div>
    );
  }

  if (!task || task.status === "pending" || task.status === "processing" || (task.status === "completed" && !showResults)) {
    return (
      <div className="py-8">
        <ProgressTracker
          progress={task?.progress || "排队中..."}
          status={task?.status || "pending"}
        />
      </div>
    );
  }

  // 完成状态 — safeResult 已在上面声明，这里保证非空


  return (
    <div className="space-y-6 animate-fade-in" role="main" aria-label="分析结果">
      {/* 完成提示 — 紧凑 */}
      <div className="text-center animate-slide-up" style={{ animationDelay: "0s" }}>
        <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800/30 shadow-sm">
          <span className="text-2xl">🎉</span>
          <div className="text-left">
            <h2 className="font-bold text-green-800 dark:text-green-300">分析完成</h2>
            <p className="text-xs text-green-600 dark:text-green-400">原始评分 {safeResult!.original_score.score.toFixed(2)} · {safeResult!.original_score.level}</p>
          </div>
        </div>
      </div>

      {/* 评分面板 */}
      <ErrorBoundary>
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <ScorePanel
          originalScore={safeResult!.original_score}
          generatedScore={safeResult!.final_score ?? safeResult!.generated_score}
          scoreDiff={safeResult!.score_diff ?? safeResult!.score_comparison?.delta}
          subDimensionScores={subDimensions}
        />
        </div>
      </ErrorBoundary>

      {/* 前后对比 — 撑满 */}
      <ErrorBoundary>
        <div className="bg-white dark:bg-gray-800/80 rounded-3xl shadow-xl shadow-pink-500/5 border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-gradient-to-r from-pink-500/5 to-purple-600/5 dark:from-pink-500/10 dark:to-purple-600/10 px-6 md:px-8 py-5 border-b border-gray-50 dark:border-gray-700">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-sm">⟺</span>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">前后对比</h3>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <BeforeAfterCompare
              originalUrl={safeResult!.original_image_url}
              generatedUrl={safeResult!.generated_image_url}
            />
          </div>
        </div>
      </ErrorBoundary>

      {/* 用户需求 */}
      <ErrorBoundary>
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <UserRequirement requirement={safeResult!.user_requirement} />
        </div>
      </ErrorBoundary>

      {/* 分析建议（分类展示） */}
      <ErrorBoundary>
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">🔍 医学美学分析</h3>
        <div className="space-y-6">
          {/* 分类展示（新） */}
          {parsedItems.length > 0 && (
            <AdviceCard
              title="综合建议"
              icon="💡"
              categorizedItems={parsedItems}
              categories={categories}
              categoryCounts={categoryCounts}
            />
          )}
          {/* 旧版原始列表（备选） */}
          {parsedItems.length === 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <AdviceCard title="当前优点" icon="👍" items={safeResult!.advice.strengths} color="pink" />
              <AdviceCard title="可改善方面" icon="🎯" items={safeResult!.advice.weaknesses} color="amber" />
              <AdviceCard title="医学美学建议" icon="💡" items={safeResult!.advice.medical_aesthetic_suggestions} color="blue" />
              <AdviceCard title="风险提示" icon="⚠️" items={safeResult!.advice.risk_notes} color="red" />
            </div>
          )}
        </div>
      </div>
      </ErrorBoundary>

      {/* 总结报告 */}
      <ErrorBoundary>
        <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <SummaryReport summary={safeResult!.summary} />
        </div>
      </ErrorBoundary>

      {/* 操作栏 */}
      <ErrorBoundary>
        <div className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
        <ActionBar taskId={taskId} />
        </div>
      </ErrorBoundary>
    </div>
  );
}
