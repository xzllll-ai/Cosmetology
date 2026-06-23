"use client";

import { ScoreResult } from "@/types";

interface Props {
  label: string;
  score: ScoreResult;
  color?: string;
}

function getScoreColor(score: number): string {
  if (score >= 4.0) return "#22c55e"; // green
  if (score >= 3.5) return "#84cc16"; // lime
  if (score >= 3.0) return "#eab308"; // yellow
  if (score >= 2.5) return "#f97316"; // orange
  return "#ef4444"; // red
}

function getLevelColor(level: string): string {
  if (level === "很高") return "text-green-600 bg-green-50";
  if (level === "较高") return "text-lime-600 bg-lime-50";
  if (level === "中等") return "text-yellow-600 bg-yellow-50";
  if (level === "一般") return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export default function ScoreDisplay({ label, score, color }: Props) {
  // Defensive: handle missing total_score (e.g. stale cached API response)
  const rawScore = score.total_score ?? 0;
  const strokeColor = color || getScoreColor(rawScore);
  const percentage = (rawScore / 5) * 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex flex-col items-center gap-3"
      aria-label={`${label}: ${rawScore.toFixed(2)} out of 5, level ${score.level}`}
    >
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: strokeColor }}
        />
        <svg className="relative w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-circle"
            style={{ filter: "drop-shadow(0 0 4px " + strokeColor + ")" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg md:text-2xl font-bold tracking-tight" style={{ color: strokeColor }}>
            {rawScore.toFixed(2)}
          </span>
          <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-medium">/ 5.00</span>
        </div>
      </div>
      <span
        className={`text-xs md:text-sm font-medium px-3 py-1.5 rounded-full shadow-sm ${getLevelColor(score.level)} dark:opacity-90`}
        style={{ border: "1px solid " + strokeColor + "33" }}
      >
        {score.level}
      </span>
      <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">{label}</span>
    </div>
  );
}
