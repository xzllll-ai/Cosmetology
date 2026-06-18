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
import { parseAdvice, estimateSubDimensionScores } from "@/lib/analysisParser";

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

  // 完成状态
  const result = task.result as AnalysisResult;

  // 解析建议 + 估算子维度分数
  const { items: parsedItems, categories, categoryCounts } = useMemo(
    () => parseAdvice(result.advice),
    [result.advice]
  );
  const { dimensions: subDimensions } = useMemo(
    () => estimateSubDimensionScores(result.original_score, result.advice),
    [result.original_score, result.advice]
  );

  return (
    <div className="space-y-8 animate-fade-in" role="main" aria-label="分析结果">
      {/* 完成提示 */}
      <div className="text-center space-y-2">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">分析完成</h2>
      </div>

      {/* 评分面板（含子维度 + 前后对比） */}
      <ErrorBoundary>
        <ScorePanel
          originalScore={result.original_score}
          generatedScore={result.generated_score}
          scoreDiff={result.score_diff}
          subDimensionScores={subDimensions}
        />
      </ErrorBoundary>

      {/* 前后对比 */}
      <ErrorBoundary>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <BeforeAfterCompare
          originalUrl={result.original_image_url}
          generatedUrl={result.generated_image_url}
        />
      </div>
      </ErrorBoundary>

      {/* 用户需求 */}
      <ErrorBoundary>
        <UserRequirement requirement={result.user_requirement} />
      </ErrorBoundary>

      {/* 分析建议（分类展示） */}
      <ErrorBoundary>
      <div className="space-y-4">
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
              <AdviceCard title="当前优点" icon="👍" items={result.advice.strengths} color="pink" />
              <AdviceCard title="可改善方面" icon="🎯" items={result.advice.weaknesses} color="amber" />
              <AdviceCard title="医学美学建议" icon="💡" items={result.advice.medical_aesthetic_suggestions} color="blue" />
              <AdviceCard title="风险提示" icon="⚠️" items={result.advice.risk_notes} color="red" />
            </div>
          )}
        </div>
      </div>
      </ErrorBoundary>

      {/* 总结报告 */}
      <ErrorBoundary>
        <SummaryReport summary={result.summary} />
      </ErrorBoundary>

      {/* 操作栏 */}
      <ErrorBoundary>
        <ActionBar taskId={taskId} />
      </ErrorBoundary>
    </div>
  );
}
