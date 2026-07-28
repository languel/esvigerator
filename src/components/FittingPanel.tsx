import React from 'react';
import { Spline } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface FittingPanelProps {
  settings: TraceSettings['fitting'];
  onChange: (fitting: Partial<TraceSettings['fitting']>) => void;
}

export const FittingPanel: React.FC<FittingPanelProps> = ({ settings, onChange }) => {
  return (
    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-100/50 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
          <Spline className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <span>6. Curve Fitting Engine</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
          Mode: {settings.mode}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-[11px] text-zinc-700 dark:text-zinc-300 font-medium mb-1">Fitting Mode</label>
          <select
            value={settings.mode}
            onChange={(e) => onChange({ mode: e.target.value as any })}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-none focus:border-zinc-500 shadow-sm"
          >
            <option value="cubicFit">Custom Schneider Error-Bounded Bézier (Outline Ribbon)</option>
            <option value="centerline">Centerline Skeleton Stroke (Fixed Width Human Style)</option>
            <option value="catmullRom">Catmull-Rom Spline to Cubic Béziers</option>
            <option value="polygon">Straight Polygon Segments (Diagnostic)</option>
            <option value="potrace">Potrace Baseline Engine</option>
          </select>
        </div>

        {/* Centerline Skeleton Mode Controls */}
        {settings.mode === 'centerline' && (
          <div className="space-y-2.5 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Stroke Width (px)</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{settings.strokeWidth} px</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={15.0}
                step={0.5}
                value={settings.strokeWidth}
                onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Line Cap</label>
                <select
                  value={settings.strokeCap}
                  onChange={(e) => onChange({ strokeCap: e.target.value as any })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-zinc-800 dark:text-zinc-200 text-xs"
                >
                  <option value="round">round</option>
                  <option value="butt">butt</option>
                  <option value="square">square</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">Line Join</label>
                <select
                  value={settings.strokeJoin}
                  onChange={(e) => onChange({ strokeJoin: e.target.value as any })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-zinc-800 dark:text-zinc-200 text-xs"
                >
                  <option value="round">round</option>
                  <option value="miter">miter</option>
                  <option value="bevel">bevel</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-zinc-500 dark:text-zinc-400">Prune Stub Threshold</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{settings.pruneStubs} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={settings.pruneStubs}
                onChange={(e) => onChange({ pruneStubs: Number(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
            </div>
          </div>
        )}

        {/* Cubic Fit Mode Controls */}
        {settings.mode === 'cubicFit' && (
          <div className="space-y-2 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Maximum Error Tolerance (px)</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{settings.maxError} px</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={15.0}
                step={0.1}
                value={settings.maxError}
                onChange={(e) => onChange({ maxError: Number(e.target.value) })}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                <span>0.1 (High Fidelity)</span>
                <span>1.5 (Default)</span>
                <span>15.0 (Ultra Smooth)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-900">
              <div>
                <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">Iterations</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={settings.maxIterations}
                  onChange={(e) => onChange({ maxIterations: Number(e.target.value) })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-zinc-800 dark:text-zinc-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">Seam Strategy</label>
                <select
                  value={settings.seamStrategy}
                  onChange={(e) => onChange({ seamStrategy: e.target.value as any })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-1 text-zinc-800 dark:text-zinc-200 text-[11px]"
                >
                  <option value="lowestCurvature">Lowest Curvature</option>
                  <option value="firstPoint">First Point</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {settings.mode === 'catmullRom' && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Spline Tension</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{settings.tension}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={settings.tension}
              onChange={(e) => onChange({ tension: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};
