"use client";

import { useState, useRef, useCallback } from "react";
import { getImageUrl } from "@/lib/api";

interface Props {
  originalUrl: string;
  generatedUrl: string;
}

export default function BeforeAfterCompare({ originalUrl, generatedUrl }: Props) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging.current) updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleTouchStart = useCallback(() => {
    dragging.current = true;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragging.current) updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSliderPos((prev) => Math.max(0, prev - 5));
      } else if (e.key === "ArrowRight") {
        setSliderPos((prev) => Math.min(100, prev + 5));
      }
    },
    []
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          原始照片
        </span>
        <span className="flex items-center gap-1.5">
          AI 效果图
          <span className="w-2 h-2 rounded-full bg-purple-400" />
        </span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden shadow-xl cursor-col-resize select-none bg-gray-100 dark:bg-gray-800"
        style={{ touchAction: "none" }}
        role="slider"
        aria-label="前后对比滑块"
        aria-valuenow={sliderPos}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onKeyDown={handleKeyDown}
      >
        {/* 原图（底层） */}
        <img
          src={getImageUrl(originalUrl)}
          alt="原始照片"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* 效果图（上层，裁剪） */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <img
            src={getImageUrl(generatedUrl)}
            alt="AI 效果图"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* 角标 */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[11px] text-white font-medium z-20">
          原图
        </div>
        <div
          className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[11px] text-white font-medium z-20"
          style={{ opacity: sliderPos > 80 ? 0.3 : 1 }}
        >
          AI
        </div>

        {/* 滑块线 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute inset-0 bg-white/80" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 border-2 border-white">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs md:text-sm font-bold">⟺</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 dark:text-gray-500">
        <span>← 拖动滑块 →</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>← → 键盘控制</span>
      </div>
    </div>
  );
}
