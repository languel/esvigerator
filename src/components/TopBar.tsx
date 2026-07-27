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
} from 'lucide-react';
import { PRESETS } from '../app/defaults';
import { TraceSettings } from '../workers/protocol';

interface TopBarProps {
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
    <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Brand & File actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-800">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-500/30">
            D
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-zinc-100 leading-none">Diagramator</h1>
            <span className="text-[10px] text-zinc-400 font-mono">Raster-to-SVG</span>
          </div>
        </div>

        <button
          onClick={onOpenImage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          Open Image
        </button>

        <button
          onClick={onLoadExample}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/50 text-xs font-medium text-indigo-200 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Neuron Example
        </button>

        {filename && (
          <span className="text-xs text-zinc-400 font-mono truncate max-w-[160px]" title={filename}>
            {filename}
          </span>
        )}
      </div>

      {/* Center: Presets & History */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium">Preset:</span>
          <select
            value={activePreset}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-transparent text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
          >
            {Object.keys(PRESETS).map((p) => (
              <option key={p} value={p} className="bg-zinc-900 text-zinc-200">
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center border-l border-r border-zinc-800 px-1 gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            title="Reset Settings"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Status & Export */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Only</span>
          {isProcessing && (
            <span className="flex items-center gap-1 ml-2 text-amber-400 font-sans">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Processing
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onCopySvg}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer"
            title="Copy SVG to Clipboard"
          >
            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
            Copy SVG
          </button>

          <button
            onClick={onExportSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export SVG
          </button>

          <button
            onClick={onExportPng}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition cursor-pointer"
            title="Export PNG Preview"
          >
            <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
            PNG
          </button>
        </div>
      </div>
    </header>
  );
};
