import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/lib/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

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
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-200">
        <ThemeProvider>
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-pink-100 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  AI 医学美容分析
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Qwen 评分 · RealVision 生成
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main */}
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
          <p>本系统仅供参考，不构成医疗建议。所有医美项目请咨询专业医生。</p>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
