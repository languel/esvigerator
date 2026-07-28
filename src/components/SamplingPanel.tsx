import React from 'react';
import { Target, Sparkles, Activity } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface SamplingPanelProps {
  settings: TraceSettings['sampling'];
  onChange: (sampling: Partial<TraceSettings['sampling']>) => void;
}

export const SamplingPanel: React.FC<SamplingPanelProps> = ({ settings, onChange }) => {
  return (
    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        <Target className="w-3.5 h-3.5 text-zinc-500" />
        <span>5. Contour Sampling & Post-Filters</span>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Sampling Strategy</label>
          <select
            value={settings.mode}
            onChange={(e) => onChange({ mode: e.target.value as any })}
            className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-2 py-1 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
          >
            <option value="douglasPeucker">Douglas–Peucker Simplification</option>
            <option value="arcLength">Fixed Arc-Length Resampling</option>
            <option value="raw">Raw Pixel Contour (No Reduction)</option>
          </select>
        </div>

        {settings.mode === 'douglasPeucker' && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Simplification Ratio (Perimeter x Ratio)</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{settings.simplifyRatio}</span>
            </div>
            <input
              type="range"
              min={0.0001}
              max={0.005}
              step={0.0001}
              value={settings.simplifyRatio}
              onChange={(e) => onChange({ simplifyRatio: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
            />
          </div>
        )}

        {/* Post-Simplification Filter Method Selection */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
            <Activity className="w-3 h-3 text-zinc-500" />
            <span>Simplification Algorithm</span>
          </div>

          <div>
            <select
              value={settings.simplificationMethod ?? 'curvatureAdaptive'}
              onChange={(e) => onChange({ simplificationMethod: e.target.value as any })}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-none focus:border-zinc-500 shadow-xs"
            >
              <option value="curvatureAdaptive">Curvature-Adaptive RDP (Preserves Sharp Tips)</option>
              <option value="visvalingamWhyatt">Visvalingam-Whyatt (Area / Scale Adaptive)</option>
              <option value="douglasPeucker">Standard Douglas-Peucker (Global Epsilon)</option>
            </select>
          </div>

          {settings.simplificationMethod === 'visvalingamWhyatt' ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>Min Triangle Area Threshold (px²)</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{settings.visvalingamAreaThreshold ?? 4.0} px²</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={50.0}
                step={0.5}
                value={settings.visvalingamAreaThreshold ?? 4.0}
                onChange={(e) => onChange({ visvalingamAreaThreshold: Number(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>RDP Simplification Epsilon</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{settings.rdpEpsilon} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={20.0}
                step={0.1}
                value={settings.rdpEpsilon}
                onChange={(e) => onChange({ rdpEpsilon: Number(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
            </div>
          )}

          {settings.simplificationMethod === 'curvatureAdaptive' && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>Protected Turn Angle Cutoff</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{settings.cornerAngleDegrees ?? 25}°</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={settings.cornerAngleDegrees ?? 25}
                onChange={(e) => onChange({ cornerAngleDegrees: Number(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
            </div>
          )}

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              <Sparkles className="w-3 h-3 text-zinc-500" />
              <span>Smoothing & Resampling</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>Laplacian Curve Smoothing</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{settings.smoothingPasses} passes</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                step={1}
                value={settings.smoothingPasses}
                onChange={(e) => onChange({ smoothingPasses: Number(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>Resampling Spacing</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{settings.resampleSpacing} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={50.0}
                step={0.5}
                value={settings.resampleSpacing}
                onChange={(e) => onChange({ resampleSpacing: Number(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
