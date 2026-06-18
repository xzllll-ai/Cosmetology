"use client";

import type { AdviceCategory } from "@/types";
import { ADVICE_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  categories: AdviceCategory[];
  categoryCounts: Record<AdviceCategory, number>;
  selected: AdviceCategory | "all";
  onChange: (cat: AdviceCategory | "all") => void;
}

export default function AdviceFilterBar({ categories, categoryCounts, selected, onChange }: Props) {
  const allCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  const pills: { key: AdviceCategory | "all"; label: string; icon?: string; count: number }[] = [
    { key: "all", label: "全部", count: allCount },
    ...categories.map((c) => ({
      key: c as AdviceCategory | "all",
      label: ADVICE_CATEGORIES[c].label,
      icon: ADVICE_CATEGORIES[c].icon,
      count: categoryCounts[c] || 0,
    })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="建议分类筛选">
      {pills.map((pill) => {
        const isActive = selected === pill.key;
        return (
          <button
            key={pill.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(pill.key)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
              isActive
                ? "bg-pink-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            )}
          >
            {pill.icon && <span>{pill.icon}</span>}
            {pill.label}
            <span className={cn(
              "text-xs ml-0.5",
              isActive ? "text-pink-200" : "text-gray-400"
            )}>
              {pill.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
