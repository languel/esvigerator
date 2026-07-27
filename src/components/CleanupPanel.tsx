import React from 'react';
import { Eraser } from 'lucide-react';
import { TraceSettings } from '../workers/protocol';

interface CleanupPanelProps {
  settings: TraceSettings['cleanup'];
  onChange: (cleanup: Partial<TraceSettings['cleanup']>) => void;
}

export const CleanupPanel: React.FC<CleanupPanelProps> = ({ settings, onChange }) => {
  return (
    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        <Eraser className="w-3.5 h-3.5 text-zinc-500" />
        <span>3. Mask Cleanup & Despeckle</span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Despeckle Min Component Area</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">{settings.minComponentArea} px²</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            step={5}
            value={settings.minComponentArea}
            onChange={(e) => onChange({ minComponentArea: Number(e.target.value) })}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Remove Holes Below Area</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">{settings.minHoleArea} px²</span>
          </div>
          <input
            type="range"
            min={0}
            max={300}
            step={5}
            value={settings.minHoleArea}
            onChange={(e) => onChange({ minHoleArea: Number(e.target.value) })}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
          />
        </div>
      </div>
    </div>
  );
};
