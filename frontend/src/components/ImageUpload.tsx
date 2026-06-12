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
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
        ${
          dragging
            ? "border-pink-500 bg-pink-50"
            : "border-gray-300 hover:border-pink-400 hover:bg-pink-50/50"
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
          <img
            src={preview}
            alt="预览"
            className="max-h-64 mx-auto rounded-xl shadow-md object-contain"
          />
          <p className="text-sm text-gray-500">点击或拖拽更换图片</p>
        </div>
      ) : (
        <div className="space-y-4 py-8">
          <div className="text-5xl">📸</div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              拖拽或点击上传照片
            </p>
            <p className="text-sm text-gray-400 mt-1">
              支持 JPG / PNG / WebP，最大 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
