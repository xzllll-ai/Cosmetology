import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 医学美容分析",
  description: "基于 AI 的医学美容评分、建议与效果图生成系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gradient-to-br from-pink-50 via-white to-purple-50 min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  AI 医学美容分析
                </h1>
                <p className="text-xs text-gray-500">
                  SCUT 评分 · Qwen 分析 · RealVision 生成
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-gray-400">
          <p>本系统仅供参考，不构成医疗建议。所有医美项目请咨询专业医生。</p>
        </footer>
      </body>
    </html>
  );
}
