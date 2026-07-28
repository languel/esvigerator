import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onImageSelected: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="h-full w-full flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 text-center select-none"
    >
      <div className="max-w-md w-full p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-900/80 transition group flex flex-col items-center gap-4 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">esvigerator</h2>
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">Drop your raster image here</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Supports PNG, JPEG, WEBP, or paste from clipboard (Ctrl+V / Cmd+V)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            Browse Image
          </button>
        </div>
      </div>
    </div>
  );
};
