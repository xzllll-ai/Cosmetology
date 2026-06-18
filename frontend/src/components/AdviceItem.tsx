"use client";

import type { CategorizedAdviceItem } from "@/types";
import { ADVICE_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  item: CategorizedAdviceItem;
}

const priorityIcon: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  low: "🟢",
};

export default function AdviceItem({ item }: Props) {
  const catInfo = ADVICE_CATEGORIES[item.category];

  const dotColors: Record<string, string> = {
    skin: "bg-rose-400",
    contour: "bg-violet-400",
    color: "bg-amber-400",
    proportion: "bg-sky-400",
    other: "bg-gray-400",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-xl border transition-all",
        catInfo.bgColor,
        "dark:border-gray-600 dark:bg-gray-700/50"
      )}
    >
      <span className={cn("w-2 h-2 mt-1.5 rounded-full shrink-0", dotColors[item.category])} />

      <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed flex-1">
        {item.text}
      </span>

      <span className="text-xs shrink-0" title={
        item.priority === "high" ? "高优先级" :
        item.priority === "medium" ? "中优先级" : "低优先级"
      }>
        {priorityIcon[item.priority]}
      </span>
    </div>
  );
}
