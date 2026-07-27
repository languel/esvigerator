import React from 'react';
import { Download, Copy, FileText } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface ExportPanelProps {
  settings: TraceSettings['export'];
  onChange: (exp: Partial<TraceSettings['export']>) => void;
  onCopySvg: () => void;
  onExportSvg: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  settings,
  onChange,
  onCopySvg,
  onExportSvg,
}) => {
  return (
    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        <FileText className="w-3.5 h-3.5 text-zinc-500" />
        <span>7. Export & Formatting Settings</span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Coordinate Precision</label>
            <select
              value={settings.precision === null ? 'full' : settings.precision}
              onChange={(e) =>
                onChange({
                  precision: e.target.value === 'full' ? null : Number(e.target.value),
                })
              }
              className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-2 py-1 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-zinc-500"
            >
              <option value="0">0 (Integer)</option>
              <option value="1">1 (0.1 Default)</option>
              <option value="2">2 (0.01)</option>
              <option value="3">3 (0.001)</option>
              <option value="full">Full Floating Precision</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Fill Color</label>
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-2 py-1">
              <input
                type="color"
                value={settings.fillColor}
                onChange={(e) => onChange({ fillColor: e.target.value })}
                className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-zinc-800 dark:text-zinc-300">{settings.fillColor}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.relativeCommands}
              onChange={(e) => onChange({ relativeCommands: e.target.checked })}
              className="rounded bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-0"
            />
            Relative Commands (c, m)
          </label>

          <label className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.transparentBackground}
              onChange={(e) => onChange({ transparentBackground: e.target.checked })}
              className="rounded bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-0"
            />
            Transparent BG
          </label>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2">
          <button
            onClick={onCopySvg}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded text-xs font-medium transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Code
          </button>
          <button
            onClick={onExportSvg}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 rounded text-xs font-medium transition cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
};
