"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  summary: string;
}

export default function ReportView({ summary }: Props) {
  if (!summary) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
        <h3 className="text-white font-bold text-lg">📝 变化总结报告</h3>
      </div>
      <div className="p-6 prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-li:text-gray-700">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
}
