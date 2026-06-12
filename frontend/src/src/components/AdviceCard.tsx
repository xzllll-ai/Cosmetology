"use client";

import { useState } from "react";

interface Props {
  title: string;
  icon: string;
  items: string[];
  color?: string;
}

export default function AdviceCard({ title, icon, items, color = "pink" }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (!items || items.length === 0) return null;

  const borderColor = {
    pink: "border-pink-200",
    amber: "border-amber-200",
    blue: "border-blue-200",
    red: "border-red-200",
  }[color] || "border-gray-200";

  const bgColor = {
    pink: "bg-pink-50",
    amber: "bg-amber-50",
    blue: "bg-blue-50",
    red: "bg-red-50",
  }[color] || "bg-gray-50";

  return (
    <div className={`bg-white rounded-xl shadow-md border ${borderColor} overflow-hidden card-hover`}>
      <button
        className={`w-full flex items-center gap-3 p-5 ${bgColor} hover:opacity-90 transition`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-2xl">{icon}</span>
        <span className="font-bold text-gray-800 flex-1 text-left">{title}</span>
        <span className="text-gray-400 text-sm">
          {items.length} 条 {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <ul className="p-5 space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
              <span className="text-pink-400 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
