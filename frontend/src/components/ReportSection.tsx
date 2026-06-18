"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  title: string;
  content: string;
  defaultExpanded?: boolean;
}

export default function ReportSection({ title, content, defaultExpanded = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <details
      open={expanded}
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
      className="group border-b border-gray-100 dark:border-gray-700 last:border-b-0"
    >
      <summary className="flex items-center gap-2 px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition select-none list-none">
        <span className="text-gray-400 dark:text-gray-500 transition-transform duration-200 group-open:rotate-90">▶</span>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
      </summary>
      <div className="px-6 pb-4 prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-300 dark:prose-li:text-gray-300">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </details>
  );
}
