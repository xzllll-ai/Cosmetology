"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onFileSelect, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("图片大小不能超过 10MB");
        return;
      }
      setPreview(URL.createObjectURL(file));
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group
        ${
          dragging
            ? "border-pink-500 bg-pink-50 dark:bg-pink-900/10 scale-[1.01]"
            : "border-gray-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50/30 dark:hover:bg-pink-900/5"
        }
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="预览"
              className="max-h-64 mx-auto rounded-xl shadow-lg border border-gray-100 object-contain"
            />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5" />
          </div>
          <p className="text-sm text-gray-400">点击或拖拽更换图片</p>
        </div>
      ) : (
        <div className="space-y-5 py-6">
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center transition-transform duration-300 ${dragging ? "scale-110" : "group-hover:scale-105"}`}>
            <span className="text-3xl">📸</span>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
              拖拽或点击上传照片
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5">
              支持 JPG / PNG / WebP · 最大 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
