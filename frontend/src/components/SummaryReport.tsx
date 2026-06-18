"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import ReportSection from "@/components/ReportSection";

interface Props {
  summary: string;
}

function splitSections(markdown: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = markdown.split("\n");
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = line.replace(/^###\s+\d+\.?\s*/, "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }
  return sections;
}

export default function SummaryReport({ summary }: Props) {
  const [expandedAll, setExpandedAll] = useState(true);

  if (!summary) return null;

  const sections = splitSections(summary);

  // If no clear sections, render as plain markdown
  if (sections.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <h3 className="text-white font-bold text-lg">📝 变化总结报告</h3>
        </div>
        <div className="p-6 prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700 dark:prose-headings:text-gray-200 dark:prose-p:text-gray-300 dark:prose-li:text-gray-300">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-3xl shadow-xl shadow-purple-500/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/15 dark:to-pink-500/15 px-6 py-5 flex items-center justify-between border-b border-gray-50 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">📝</span>
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            变化总结报告
          </h3>
        </div>
        <button
          onClick={() => setExpandedAll(!expandedAll)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-full transition font-medium"
        >
          {expandedAll ? "全部收起" : "全部展开"}
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {sections.map((section, i) => (
          <ReportSection
            key={i}
            title={section.title}
            content={section.content}
            defaultExpanded={expandedAll}
          />
        ))}
      </div>
    </div>
  );
}
