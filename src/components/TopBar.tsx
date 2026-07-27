import React from 'react';
import {
  FolderOpen,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  ShieldCheck,
  FileCode,
  Image as ImageIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { PRESETS } from '../app/defaults';

interface TopBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenImage: () => void;
  onLoadExample: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activePreset: string;
  onSelectPreset: (presetName: string) => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onCopySvg: () => void;
  isProcessing: boolean;
  filename: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  theme,
  onToggleTheme,
  onOpenImage,
  onLoadExample,
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activePreset,
  onSelectPreset,
  onExportSvg,
  onExportPng,
  onCopySvg,
  isProcessing,
  filename,
}) => {
  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 flex items-center justify-between z-20 shrink-0 select-none text-zinc-900 dark:text-zinc-100">
      {/* Left: Brand & File actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-200 dark:border-zinc-800">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold shadow-sm">
            D
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide leading-none">Diagramator</h1>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Raster-to-SVG</span>
          </div>
        </div>

        <button
          onClick={onOpenImage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          Open Image
        </button>

        <button
          onClick={onLoadExample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium transition cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Neuron Example
        </button>

        {filename && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[160px]" title={filename}>
            {filename}
          </span>
        )}
      </div>

      {/* Center: Presets & History */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Preset:</span>
          <select
            value={activePreset}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
          >
            {Object.keys(PRESETS).map((p) => (
              <option key={p} value={p} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center border-l border-r border-zinc-200 dark:border-zinc-800 px-1 gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 transition cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 transition cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            title="Reset Settings"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Right: Status & Export */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          <span>Local Only</span>
          {isProcessing && (
            <span className="flex items-center gap-1 ml-2 font-sans font-medium text-zinc-800 dark:text-zinc-200">
              <span className="w-2 h-2 rounded-full bg-zinc-600 dark:bg-zinc-400 animate-ping" />
              Processing
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onCopySvg}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition cursor-pointer"
            title="Copy SVG to Clipboard"
          >
            <FileCode className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            Copy Code
          </button>

          <button
            onClick={onExportSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export SVG
          </button>

          <button
            onClick={onExportPng}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium transition cursor-pointer"
            title="Export PNG Preview"
          >
            <ImageIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            PNG
          </button>
        </div>
      </div>
    </header>
  );
};
