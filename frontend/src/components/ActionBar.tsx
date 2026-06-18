"use client";

import { useState } from "react";
import { downloadReport } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Props {
  taskId: string;
}

export default function ActionBar({ taskId }: Props) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReport(taskId);
    } catch (e) {
      console.error("Download failed", e);
    }
    setDownloading(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-8">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="group w-full sm:w-auto px-7 py-3.5 bg-white dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-sm hover:border-pink-300 dark:hover:border-pink-600 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2.5"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">📥</span>
        {downloading ? "下载中..." : "下载分析报告"}
      </button>
      <button
        onClick={() => router.push("/")}
        className="group w-full sm:w-auto px-9 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold text-sm hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
      >
        <span className="text-lg group-hover:rotate-12 transition-transform">✨</span>
        重新分析
      </button>
    </div>
  );
}
