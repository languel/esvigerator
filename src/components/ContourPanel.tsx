import { Layers } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface ContourPanelProps {
  settings: TraceSettings['contours'];
  onChange: (contours: Partial<TraceSettings['contours']>) => void;
}

export const ContourPanel: React.FC<ContourPanelProps> = ({ settings, onChange }) => {
  return (
    <div className="p-3 border-b border-zinc-800 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>4. Contour Hierarchy & Topology</span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.preserveHoles}
              onChange={(e) => onChange({ preserveHoles: e.target.checked })}
              className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0"
            />
            Preserve Interior Holes
          </label>

          <label className="text-[11px] text-zinc-400 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.outerOnly}
              onChange={(e) => onChange({ outerOnly: e.target.checked })}
              className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0"
            />
            Outer Contours Only
          </label>
        </div>

        <div>
          <label className="block text-[11px] text-zinc-400 mb-1">Fill Rule</label>
          <select
            value={settings.fillRule}
            onChange={(e) => onChange({ fillRule: e.target.value as any })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="evenodd">evenodd (Default - Automatic Hole Cutouts)</option>
            <option value="nonzero">nonzero</option>
          </select>
        </div>
      </div>
    </div>
  );
};
