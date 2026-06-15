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
      <div className="text-center space-y-3 pt-4">
        <h2 className="text-3xl font-bold text-gray-800">
          开始您的 AI 美容分析
        </h2>
        <p className="text-gray-500">
          上传一张正面照片，AI 将为您进行专业的医学美学分析，并生成美容效果图
        </p>
      </div>

      {/* Upload */}
      <ImageUpload onFileSelect={setFile} disabled={loading} />

      {/* Requirement Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          💬 美容需求（可选）
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition"
          rows={3}
          placeholder="描述您的美容需求，例如：&#10;• 我想让皮肤更紧致&#10;• 我想改善法令纹&#10;• 我想让脸部轮廓更清晰"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          ❌ {error}
        </div>
      )}

      {/* Submit */}
      <button
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all
          ${
            file && !loading
              ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
              : "bg-gray-300 cursor-not-allowed"
          }
        `}
        disabled={!file || loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            上传中...
          </span>
        ) : (
          "✨ 开始分析"
        )}
      </button>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium">ℹ️ 使用说明</p>
        <ul className="list-disc list-inside space-y-1 text-blue-600">
          <li>请上传清晰的正面照片</li>
          <li>分析过程约需 2-4 分钟，请耐心等待</li>
          <li>所有结果仅供参考，不构成医疗建议</li>
        </ul>
      </div>
    </div>
  );
}
