"use client";

import type { ScoreResult } from "@/types";

interface Props {
  originalScore: ScoreResult;
  generatedScore?: ScoreResult;
  scoreDiff?: number;
}

function getScoreColor(score: number): string {
  if (score >= 4.0) return "#22c55e";
  if (score >= 3.5) return "#84cc16";
  if (score >= 3.0) return "#eab308";
  if (score >= 2.5) return "#f97316";
  return "#ef4444";
}

export default function ScoreComparisonBar({ originalScore, generatedScore, scoreDiff }: Props) {
  const hasComparison = generatedScore !== undefined;
  const originalPct = (originalScore.score / 5) * 100;
  const generatedPct = hasComparison ? (generatedScore!.score / 5) * 100 : 0;
  const origColor = getScoreColor(originalScore.score);
  const genColor = hasComparison ? getScoreColor(generatedScore!.score) : origColor;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">原始照片</span>
          <span className="font-semibold" style={{ color: origColor }}>
            {originalScore.score.toFixed(2)}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${originalPct}%`, backgroundColor: origColor }}
          />
        </div>
        <span className="text-xs text-gray-400">{originalScore.level}</span>
      </div>

      {hasComparison && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">AI 效果图</span>
            <span className="font-semibold" style={{ color: genColor }}>
              {generatedScore!.score.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${generatedPct}%`, backgroundColor: genColor }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{generatedScore!.level}</span>
            {scoreDiff !== undefined && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  scoreDiff > 0
                    ? "text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                    : scoreDiff < 0
                    ? "text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
                    : "text-gray-500 bg-gray-50"
                }`}
              >
                {scoreDiff > 0 ? "+" : ""}{scoreDiff.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
