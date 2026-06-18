"use client";

import type { SubDimensionScore } from "@/types";

interface Props {
  scores: SubDimensionScore[];
}

function getColor(score: number): string {
  if (score >= 4.0) return "#22c55e";
  if (score >= 3.5) return "#84cc16";
  if (score >= 3.0) return "#eab308";
  if (score >= 2.5) return "#f97316";
  return "#ef4444";
}

export default function SubDimensionScoreList({ scores }: Props) {
  if (!scores.length) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">子维度评分估算</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores.map((dim) => {
          const color = getColor(dim.score);
          const pct = (dim.score / 5) * 100;
          const circumference = 2 * Math.PI * 28;
          const offset = circumference - (pct / 100) * circumference;

          return (
            <div
              key={dim.name}
              className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
            >
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke={color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="score-circle"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color }}>
                    {dim.score.toFixed(1)}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{dim.label}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{dim.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
