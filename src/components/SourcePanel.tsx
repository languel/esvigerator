import React from 'react';
import { Sliders } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface SourcePanelProps {
  settings: TraceSettings['source'];
  onChange: (source: Partial<TraceSettings['source']>) => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({ settings, onChange }) => {
  return (
    <div className="p-3 border-b border-zinc-800 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
        <span>1. Source & Image Preprocess</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">Grayscale Mode</label>
          <select
            value={settings.grayscaleMode}
            onChange={(e) => onChange({ grayscaleMode: e.target.value as any })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="luminance">Luminance</option>
            <option value="average">Average</option>
            <option value="red">Red Channel</option>
            <option value="green">Green Channel</option>
            <option value="blue">Blue Channel</option>
            <option value="alpha">Alpha Channel</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">Max Dimension</label>
          <select
            value={settings.maxDimension}
            onChange={(e) => onChange({ maxDimension: Number(e.target.value) })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value={800}>800 px</option>
            <option value={1200}>1200 px</option>
            <option value={1600}>1600 px (Default)</option>
            <option value={2400}>2400 px</option>
            <option value={4000}>Original (No Downsample)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <label className="text-[11px] text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.invert}
            onChange={(e) => onChange({ invert: e.target.checked })}
            className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0"
          />
          Invert Image Colors
        </label>

        <label className="text-[11px] text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.cropEmpty}
            onChange={(e) => onChange({ cropEmpty: e.target.checked })}
            className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0"
          />
          Crop Margins ({settings.cropPadding}px)
        </label>
      </div>
    </div>
  );
};
