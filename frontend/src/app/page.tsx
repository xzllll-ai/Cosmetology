"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { uploadImage } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const { task_id } = await uploadImage(
        file,
        requirement.trim() || undefined
      );
      router.push(`/results/${task_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 pt-8 md:pt-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-full text-xs text-pink-600 dark:text-pink-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          AI 医学美容分析系统
        </div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          <span className="text-gradient">开始您的</span>
          <br />
          <span className="text-gray-800 dark:text-gray-100">AI 美容分析</span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          上传一张正面照片，AI 将为您进行专业的医学美学分析，
          从多维度评估面部特征，并生成美容效果图
        </p>
      </div>

      {/* Upload Card */}
      <div className="bg-white dark:bg-gray-800/80 rounded-3xl shadow-xl shadow-pink-500/5 border border-gray-100 dark:border-gray-700 p-8 space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-gray-50 dark:border-gray-700">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">📸</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">上传照片</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">支持 JPG / PNG / WebP，最大 10MB</p>
          </div>
        </div>
        <ImageUpload onFileSelect={setFile} disabled={loading} />

        {/* Requirement Input */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="text-base">💬</span> 美容需求 <span className="text-gray-400 dark:text-gray-500 font-normal">（可选）</span>
          </label>
          <textarea
            className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 focus:bg-white dark:focus:bg-gray-700 resize-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            rows={3}
            placeholder="描述您的美容需求，例如：改善皮肤紧致度、淡化法令纹、提升面部轮廓..."
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-5 py-4 rounded-2xl text-sm border border-red-100 dark:border-red-800 flex items-start gap-3">
            <span className="text-lg mt-0.5">❌</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 relative overflow-hidden
            ${
              file && !loading
                ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 hover:-translate-y-0.5 active:translate-y-0"
                : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed text-gray-400 dark:text-gray-500"
            }
          `}
          disabled={!file || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              正在分析...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✨</span> 开始 AI 分析
            </span>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-5 border border-blue-100/50 dark:border-blue-800/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-sm">ℹ️</span>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-300">使用说明</p>
            <ul className="space-y-1.5 text-blue-600/80 dark:text-blue-400/80">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                请上传清晰的正面照片，确保光线充足
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                分析过程约需 2-4 分钟，请耐心等待
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                所有结果由 AI 生成，仅供参考，不构成医疗建议
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
