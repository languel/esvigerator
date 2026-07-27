import React from 'react';
import { Target } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface SamplingPanelProps {
  settings: TraceSettings['sampling'];
  onChange: (sampling: Partial<TraceSettings['sampling']>) => void;
}

export const SamplingPanel: React.FC<SamplingPanelProps> = ({ settings, onChange }) => {
  return (
    <div className="p-3 border-b border-zinc-800 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
        <Target className="w-3.5 h-3.5 text-indigo-400" />
        <span>5. Contour Sampling & Simplification</span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">Sampling Strategy</label>
          <select
            value={settings.mode}
            onChange={(e) => onChange({ mode: e.target.value as any })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="douglasPeucker">Douglas–Peucker Simplification</option>
            <option value="arcLength">Fixed Arc-Length Resampling</option>
            <option value="raw">Raw Pixel Contour (No Reduction)</option>
          </select>
        </div>

        {settings.mode === 'douglasPeucker' && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>Simplification Ratio (Perimeter x Ratio)</span>
              <span className="font-mono text-indigo-400">{settings.simplifyRatio}</span>
            </div>
            <input
              type="range"
              min={0.0001}
              max={0.005}
              step={0.0001}
              value={settings.simplifyRatio}
              onChange={(e) => onChange({ simplifyRatio: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {settings.mode === 'arcLength' && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>Sample Spacing (px)</span>
              <span className="font-mono text-indigo-400">{settings.sampleSpacing} px</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={0.5}
              value={settings.sampleSpacing}
              onChange={(e) => onChange({ sampleSpacing: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
