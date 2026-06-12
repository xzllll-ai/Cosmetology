"use client";

interface Props {
  progress: string;
  status: string;
}

const STEPS = [
  { label: "颜值评分", icon: "📊" },
  { label: "美学分析", icon: "🔍" },
  { label: "效果图生成", icon: "🎨" },
  { label: "效果复评", icon: "📈" },
  { label: "变化总结", icon: "📝" },
];

function getStepIndex(progress: string, status: string): number {
  // 任务完成 → 所有步骤完成
  if (status === "completed") return 5;

  // 优先按 "X/5" 编号精确匹配（避免关键词冲突）
  if (progress.includes("1/5")) return 0;
  if (progress.includes("2/5")) return 1;
  if (progress.includes("3/5")) return 2;
  if (progress.includes("4/5")) return 3;
  if (progress.includes("5/5")) return 4;

  // 降级：按关键词匹配（仅在没有 X/5 编号时）
  if (progress.includes("评分中")) return 0;
  if (progress.includes("美学分析") || progress.includes("医学美学")) return 1;
  if (progress.includes("效果图生成") || progress.includes("RealVision")) return 2;
  if (progress.includes("复评")) return 3;
  if (progress.includes("变化总结") || progress.includes("Qwen 生成")) return 4;
  if (progress.includes("完成")) return 5;

  return -1;
}

export default function ProgressTracker({ progress, status }: Props) {
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const currentStep = status === "pending" ? -1 : getStepIndex(progress, status);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
        {isCompleted ? "✅ 分析完成" : isFailed ? "❌ 分析失败" : "正在分析中"}
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center">
        {isCompleted
          ? "所有步骤已完成，正在跳转..."
          : isFailed
          ? "分析过程中出现错误"
          : "分析过程约需 3-5 分钟，请耐心等待"}
      </p>

      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const isActive = !isCompleted && !isFailed && i === currentStep;
          const isDone = isCompleted || isFailed ? isCompleted : i < currentStep;
          const isPending = !isCompleted && !isFailed && i > currentStep;

          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all
                ${isActive ? "bg-pink-50 border border-pink-200 animate-pulse-glow" : ""}
                ${isDone ? "bg-green-50" : ""}
                ${isPending ? "opacity-40" : ""}
              `}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                  ${isActive ? "bg-pink-500 text-white" : ""}
                  ${isDone ? "bg-green-500 text-white" : ""}
                  ${isPending ? "bg-gray-200 text-gray-400" : ""}
                `}
              >
                {isDone ? "✓" : step.icon}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    isActive
                      ? "text-pink-700"
                      : isDone
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-pink-500 mt-1">{progress}</p>
                )}
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
