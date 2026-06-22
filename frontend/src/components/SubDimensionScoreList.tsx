"use client";

import { useState } from "react";
import type { SubDimensionScore } from "@/types";

interface Props {
  scores: SubDimensionScore[];
  /** 效果图的维度分数（可选，用于对比） */
  generatedScores?: SubDimensionScore[];
}

function getColor(score: number): string {
  if (score >= 4.0) return "#22c55e";
  if (score >= 3.5) return "#84cc16";
  if (score >= 3.0) return "#eab308";
  if (score >= 2.5) return "#f97316";
  return "#ef4444";
}

function getDeltaColor(delta: number | undefined): string {
  if (delta === undefined) return "text-gray-400";
  if (delta > 0) return "text-green-500";
  if (delta < 0) return "text-red-500";
  return "text-gray-400";
}

function DeltaBadge({ delta }: { delta: number | undefined }) {
  if (delta === undefined) return null;
  const sign = delta > 0 ? "+" : "";
  const cls = getDeltaColor(delta);
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  return (
    <span className={`text-xs font-bold tabular-nums ${cls}`}>
      {arrow} {sign}{delta.toFixed(2)}
    </span>
  );
}

interface DimensionCellProps {
  dim: SubDimensionScore;
  genDim?: SubDimensionScore;
  compact?: boolean;
}

function DimensionCell({ dim, genDim, compact = false }: DimensionCellProps) {
  const pct = (dim.score / 5) * 100;
  const circumference = 2 * Math.PI * (compact ? 20 : 28);
  const offset = circumference - (pct / 100) * circumference;
  const color = getColor(dim.score);
  const radius = compact ? 20 : 28;
  const svgSize = compact ? 48 : 64;
  const fontSize = compact ? "text-[11px]" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-1 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700/50 transition-colors">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${svgSize * 2} ${svgSize * 2}`}>
          <circle
            cx={svgSize} cy={svgSize}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={compact ? 4 : 5}
          />
          <circle
            cx={svgSize} cy={svgSize}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={compact ? 4 : 5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${fontSize}`} style={{ color }}>
            {dim.score.toFixed(1)}
          </span>
        </div>
      </div>

      <span className="text-xs text-gray-600 dark:text-gray-300 text-center font-medium leading-tight">
        {dim.label}
      </span>

      {genDim && (
        <DeltaBadge delta={genDim.score - dim.score} />
      )}

      {dim.description && !compact && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-tight">
          {dim.description}
        </span>
      )}
    </div>
  );
}

export default function SubDimensionScoreList({ scores, generatedScores }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!scores.length) return null;

  // 重点维度（分最高的 4 个）默认展示，其余折叠
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const topDims = sorted.slice(0, 4);
  const collapsedDims = sorted.slice(4);
  const visibleDims = expanded ? sorted : topDims;

  const gridCols = visibleDims.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8";

  const headerLabel = (() => {
    const hasReal = scores[0]?.delta !== undefined;
    if (hasReal) return "多维度评分对比";
    return "子维度评分估算";
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">{headerLabel}</h4>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {scores[0]?.delta !== undefined ? "已对比效果图" : "估算值"}
        </span>
      </div>

      <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
        {visibleDims.map((dim) => {
          const genDim = generatedScores?.find((g) => g.name === dim.name);
          return (
            <DimensionCell
              key={dim.name}
              dim={dim}
              genDim={genDim}
              compact={visibleDims.length > 4}
            />
          );
        })}
      </div>

      {collapsedDims.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20"
        >
          <span>{expanded ? "收起" : `显示更多 ${collapsedDims.length} 个维度`}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}