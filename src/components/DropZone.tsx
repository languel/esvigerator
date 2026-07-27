import React, { useRef } from 'react';
import { Upload, Sparkles } from 'lucide-react';

interface DropZoneProps {
  onImageSelected: (file: File) => void;
  onLoadExample: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onImageSelected, onLoadExample }) => {
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
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Drop your raster image here</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
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
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
          >
            Browse Image
          </button>

          <button
            onClick={onLoadExample}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            Load Neuron Example
          </button>
        </div>
      </div>
    </div>
  );
};
