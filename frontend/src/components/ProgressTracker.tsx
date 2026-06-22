"use client";

import { useEffect, useState } from "react";
import { PIPELINE_STEPS } from "@/lib/progressSteps";

interface Props {
  progress: string;
  status: string;
}

function getStepIndex(progress: string, status: string): number {
  if (status === "completed") return 3;
  if (progress.includes("1/3")) return 0;
  if (progress.includes("2/3")) return 1;
  if (progress.includes("3/3")) return 2;
  if (progress.includes("评分") || progress.includes("分析中")) return 0;
  if (progress.includes("RealVision") || progress.includes("Qwen 分析驱动")) return 1;
  if (progress.includes("变化总结") || progress.includes("Qwen 生成")) return 2;
  if (progress.includes("完成")) return 3;
  return -1;
}

export default function ProgressTracker({ progress, status }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const currentStepIndex = status === "pending" ? -1 : getStepIndex(progress, status);
  const isProcessing = !isCompleted && !isFailed;

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => setElapsed((p) => p + 10), 10000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const estRemaining = (() => {
    if (!isProcessing || currentStepIndex < 0) return null;
    return PIPELINE_STEPS.slice(currentStepIndex).reduce((s, step) => s + step.estimatedSeconds, 0);
  })();

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-3xl shadow-xl shadow-pink-500/5 border border-gray-100 dark:border-gray-700 p-8 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full text-xs font-medium text-pink-600 dark:text-pink-400 mb-4 border border-pink-100/50 dark:border-pink-800/30">
          <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-pink-500 animate-pulse" : isCompleted ? "bg-green-500" : "bg-red-500"}`} />
          {isCompleted ? "已完成" : isFailed ? "失败" : "处理中"}
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {isCompleted ? "✅ 分析完成" : isFailed ? "❌ 分析失败" : "正在分析中"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isCompleted
            ? "所有步骤已完成，正在跳转..."
            : isFailed
            ? "分析过程中出现错误"
            : isProcessing && estRemaining
            ? "预计还需 " + Math.ceil(estRemaining / 60) + " 分钟，请耐心等待"
            : "分析过程约需 2-4 分钟，请耐心等待"}
          {elapsed > 30 && isProcessing && (
            <span className="block text-xs text-gray-400 mt-1">已等待 {elapsed} 秒</span>
          )}
        </p>
      </div>

      <div className="relative">
        {/* 连接线 */}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700" />

        <div className="space-y-2 relative">
          {PIPELINE_STEPS.map((step, i) => {
            const isActive = isProcessing && i === currentStepIndex;
            const isDone = isCompleted || (isProcessing && i < currentStepIndex);
            const isPending = isProcessing && i > currentStepIndex;

            return (
              <div
                key={i}
                className={
                  `relative flex items-start gap-4 p-5 rounded-2xl transition-all duration-500 ` +
                  (isActive ? `bg-gradient-to-r from-pink-50 to-purple-50/50 dark:from-pink-900/10 dark:to-purple-900/5 border border-pink-200/50 dark:border-pink-700/30 shadow-sm ` : `bg-transparent `) +
                  (isDone ? `opacity-100 ` : ``) +
                  (isPending ? `opacity-40 ` : ``)
                }
              >
                {/* 步骤指示器 */}
                <div className="relative z-10 mt-0.5">
                  <div
                    className={
                      `w-[46px] h-[46px] rounded-2xl flex items-center justify-center text-lg transition-all duration-500 ` +
                      (isActive ? `bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 scale-110 ` : ``) +
                      (isDone ? `bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md ` : ``) +
                      (isPending ? `bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 ` : ``)
                    }
                  >
                    {isDone ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <p
                    className={
                      `font-semibold text-sm ` +
                      (isActive ? `text-pink-700 dark:text-pink-300 ` : ``) +
                      (isDone ? `text-green-700 dark:text-green-300 ` : ``) +
                      (isPending ? `text-gray-500 dark:text-gray-400 ` : ``)
                    }
                  >
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-xs text-pink-500 dark:text-pink-400 mt-1.5 font-medium">{progress}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{step.description}</p>
                </div>

                {/* 活跃状态 spinner */}
                {isActive && (
                  <div className="shrink-0 pt-1">
                    <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
