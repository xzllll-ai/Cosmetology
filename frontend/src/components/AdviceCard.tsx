"use client";

import { useState } from "react";
import type { CategorizedAdviceItem, AdviceCategory } from "@/types";
import AdviceFilterBar from "@/components/AdviceFilterBar";
import AdviceItem from "@/components/AdviceItem";
import { filterAdviceItems } from "@/lib/analysisParser";

interface Props {
  title: string;
  icon: string;
  items?: string[];
  categorizedItems?: CategorizedAdviceItem[];
  categories?: AdviceCategory[];
  categoryCounts?: Record<AdviceCategory, number>;
  color?: string;
}

const borderColorMap: Record<string, string> = {
  pink: "border-pink-200 dark:border-pink-800",
  amber: "border-amber-200 dark:border-amber-800",
  blue: "border-blue-200 dark:border-blue-800",
  red: "border-red-200 dark:border-red-800",
};

const bgColorMap: Record<string, string> = {
  pink: "bg-pink-50 dark:bg-pink-900/20",
  amber: "bg-amber-50 dark:bg-amber-900/20",
  blue: "bg-blue-50 dark:bg-blue-900/20",
  red: "bg-red-50 dark:bg-red-900/20",
};

export default function AdviceCard({
  title, icon, items, categorizedItems, categories, categoryCounts, color = "pink",
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<AdviceCategory | "all">("all");
  const hasCategorized = categorizedItems && categorizedItems.length > 0 && categories && categoryCounts;

  if (hasCategorized) {
    const filtered = filterAdviceItems(categorizedItems!, selectedCategory, "all");

    return (
      <div className="space-y-3">
        <AdviceFilterBar
          categories={categories!}
          categoryCounts={categoryCounts!}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
        <div className="space-y-2">
          {filtered.map((item) => (
            <AdviceItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  // Legacy mode: plain string items
  if (!items || items.length === 0) return null;

  const borderColor = borderColorMap[color] || "border-gray-200";
  const bgColor = bgColorMap[color] || "bg-gray-50";

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border ${borderColor} overflow-hidden card-hover`}>
      <button
        className={`w-full flex items-center gap-3 p-5 ${bgColor} hover:opacity-90 transition`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="text-2xl">{icon}</span>
        <span className="font-bold text-gray-800 dark:text-gray-100 flex-1 text-left">{title}</span>
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          {items.length} 条 {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <ul className="p-5 space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="text-pink-400 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
