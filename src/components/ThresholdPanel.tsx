import React from 'react';
import { Eye } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface ThresholdPanelProps {
  settings: TraceSettings['threshold'];
  onChange: (threshold: Partial<TraceSettings['threshold']>) => void;
}

export const ThresholdPanel: React.FC<ThresholdPanelProps> = ({ settings, onChange }) => {
  return (
    <div className="p-3 border-b border-zinc-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>2. Thresholding & Mask</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
          Val: {settings.value}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">Threshold Mode</label>
          <select
            value={settings.mode}
            onChange={(e) => onChange({ mode: e.target.value as any })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="global">Global Manual Threshold</option>
            <option value="otsu">Otsu Automatic Threshold</option>
            <option value="adaptiveMean">Adaptive Mean</option>
            <option value="adaptiveGaussian">Adaptive Gaussian</option>
          </select>
        </div>

        {settings.mode === 'global' && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>Cutoff Threshold (0-255)</span>
              <span className="font-mono text-indigo-400">{settings.value}</span>
            </div>
            <input
              type="range"
              min={0}
              max={255}
              value={settings.value}
              onChange={(e) => onChange({ value: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {(settings.mode === 'adaptiveMean' || settings.mode === 'adaptiveGaussian') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Block Size</label>
              <input
                type="number"
                min={3}
                max={99}
                step={2}
                value={settings.blockSize}
                onChange={(e) => onChange({ blockSize: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Constant</label>
              <input
                type="number"
                min={-50}
                max={50}
                value={settings.constant}
                onChange={(e) => onChange({ constant: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
