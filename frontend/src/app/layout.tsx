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
      <body className="bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-200 relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-200/30 dark:bg-pink-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-pink-100/20 to-purple-100/20 dark:from-pink-500/3 dark:to-purple-500/3 rounded-full blur-3xl" />
        </div>
        <ThemeProvider>
        {/* Header */}
        <header className="relative z-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-pink-100/50 dark:border-gray-700/50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <span className="text-white text-lg">✨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  AI 医学美容分析
                </h1>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wider uppercase">
                  Qwen · RealVision · AI
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main */}
        <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">{children}</main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-6 text-xs text-gray-400 dark:text-gray-500">
          <p>本系统仅供参考，不构成医疗建议 · 所有医美项目请咨询专业医生</p>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
