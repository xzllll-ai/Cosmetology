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
  const rawOrig = originalScore.total_score ?? 0;
  const rawGen = hasComparison ? (generatedScore!.total_score ?? 0) : 0;
  const originalPct = (rawOrig / 5) * 100;
  const generatedPct = hasComparison ? (rawGen / 5) * 100 : 0;
  const origColor = getScoreColor(rawOrig);
  const genColor = hasComparison ? getScoreColor(rawGen) : origColor;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: origColor }} />
            原始照片
          </span>
          <span className="font-bold tabular-nums" style={{ color: origColor }}>
            {rawOrig.toFixed(2)}
          </span>
        </div>
        <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${originalPct}%`, background: `linear-gradient(90deg, ${origColor}88, ${origColor})` }}
          />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{originalScore.level}</span>
      </div>

      {hasComparison && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: genColor }} />
              AI 效果图
            </span>
            <span className="font-bold tabular-nums" style={{ color: genColor }}>
              {rawGen.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${generatedPct}%`, background: `linear-gradient(90deg, ${genColor}88, ${genColor})` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 dark:text-gray-500">{generatedScore!.level}</span>
            {scoreDiff !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                  scoreDiff > 0
                    ? "text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-700"
                    : scoreDiff < 0
                    ? "text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700"
                    : "text-gray-500 bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200"
                }`}
              >
                {scoreDiff > 0 ? "↑" : scoreDiff < 0 ? "↓" : "→"}
                {" "}
                {scoreDiff > 0 ? "+" : ""}{scoreDiff.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
