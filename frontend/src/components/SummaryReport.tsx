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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">📝 变化总结报告</h3>
        <button
          onClick={() => setExpandedAll(!expandedAll)}
          className="text-white/80 hover:text-white text-xs bg-white/20 px-3 py-1 rounded-full transition"
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
