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

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-medium text-gray-600">
        <span>📸 原始照片</span>
        <span>✨ AI 效果图</span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
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

        {/* 滑块线 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md z-10"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-gray-600 text-sm">⟺</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">拖动滑块对比前后效果</p>
    </div>
  );
}
