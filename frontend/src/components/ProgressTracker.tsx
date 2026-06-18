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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
        {isCompleted ? "✅ 分析完成" : isFailed ? "❌ 分析失败" : "正在分析中"}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
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

      <div className="space-y-4">
        {PIPELINE_STEPS.map((step, i) => {
          const isActive = isProcessing && i === currentStepIndex;
          const isDone = isCompleted || (isProcessing && i < currentStepIndex);
          const isPending = isProcessing && i > currentStepIndex;

          return (
            <div
              key={i}
              className={
                `flex items-center gap-4 p-4 rounded-xl transition-all ` +
                (isActive ? `bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 animate-pulse-glow ` : ``) +
                (isDone ? `bg-green-50 dark:bg-green-900/20 ` : ``) +
                (isPending ? `opacity-40 ` : ``)
              }
            >
              <div
                className={
                  `w-10 h-10 rounded-full flex items-center justify-center text-lg ` +
                  (isActive ? `bg-pink-500 text-white ` : ``) +
                  (isDone ? `bg-green-500 text-white ` : ``) +
                  (isPending ? `bg-gray-200 dark:bg-gray-600 text-gray-400 ` : ``)
                }
              >
                {isDone ? "✓" : step.icon}
              </div>
              <div className="flex-1">
                <p
                  className={
                    `font-medium ` +
                    (isActive ? `text-pink-700 dark:text-pink-300 ` : ``) +
                    (isDone ? `text-green-700 dark:text-green-300 ` : ``) +
                    (isPending ? `text-gray-500 dark:text-gray-400 ` : ``)
                  }
                >
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-pink-500 dark:text-pink-400 mt-1">{progress}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{step.description}</p>
              </div>
              {isActive && (
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
