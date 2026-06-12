"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTaskStatus } from "@/lib/api";
import { TaskStatus, AnalysisResult } from "@/types";
import ProgressTracker from "@/components/ProgressTracker";
import ScoreDisplay from "@/components/ScoreDisplay";
import AdviceCard from "@/components/AdviceCard";
import BeforeAfterCompare from "@/components/BeforeAfterCompare";
import ReportView from "@/components/ReportView";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // 轮询直到完成
  useEffect(() => {
    if (task?.status === "completed" || task?.status === "failed") {
      // 停止轮询（通过清除上面的 interval）
    }
  }, [task?.status]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
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

  if (!task || task.status === "pending" || task.status === "processing") {
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

  return (
    <div className="space-y-8">
      {/* 完成提示 */}
      <div className="text-center space-y-2">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800">分析完成</h2>
      </div>

      {/* 评分对比 */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
          📊 评分对比
        </h3>
        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
          <ScoreDisplay label="原始照片" score={result.original_score} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">→</span>
            <span
              className={`text-lg font-bold ${
                result.score_diff > 0
                  ? "text-green-600"
                  : result.score_diff < 0
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {result.score_diff > 0 ? "+" : ""}
              {result.score_diff.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">变化</span>
          </div>
          <ScoreDisplay label="AI 效果图" score={result.generated_score} />
        </div>
      </div>

      {/* 前后对比 */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <BeforeAfterCompare
          originalUrl={result.original_image_url}
          generatedUrl={result.generated_image_url}
        />
      </div>

      {/* 用户需求 */}
      {result.user_requirement && (
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
          <h3 className="font-bold text-purple-800 mb-2">💡 您的需求</h3>
          <p className="text-purple-700">{result.user_requirement}</p>
        </div>
      )}

      {/* 分析建议 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">🔍 医学美学分析</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <AdviceCard
            title="当前优点"
            icon="👍"
            items={result.advice.strengths}
            color="pink"
          />
          <AdviceCard
            title="可改善方面"
            icon="🎯"
            items={result.advice.weaknesses}
            color="amber"
          />
          <AdviceCard
            title="医学美学建议"
            icon="💡"
            items={result.advice.medical_aesthetic_suggestions}
            color="blue"
          />
          <AdviceCard
            title="风险提示"
            icon="⚠️"
            items={result.advice.risk_notes}
            color="red"
          />
        </div>
      </div>

      {/* 总结报告 */}
      <ReportView summary={result.summary} />

      {/* 重新分析 */}
      <div className="text-center pb-8">
        <button
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 transition shadow-lg"
          onClick={() => router.push("/")}
        >
          ✨ 重新分析
        </button>
      </div>
    </div>
  );
}
