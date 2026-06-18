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
        className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm flex items-center justify-center gap-2"
      >
        {downloading ? "下载中..." : "📥 下载分析报告"}
      </button>
      <button
        onClick={() => router.push("/")}
        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 transition shadow-lg flex items-center justify-center gap-2"
      >
        ✨ 重新分析
      </button>
    </div>
  );
}
