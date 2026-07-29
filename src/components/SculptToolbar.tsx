import React from 'react';
import { Hand, Waves, Triangle, Maximize, Minimize } from 'lucide-react';
import { SculptToolType, SculptBrushOptions } from '../geometry/sculpt';

interface SculptToolbarProps {
  brushOptions: SculptBrushOptions;
  onChangeOptions: (options: Partial<SculptBrushOptions>) => void;
  onClose: () => void;
}

const TOOLS: { type: SculptToolType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'grab', label: 'Grab / Push', icon: Hand },
  { type: 'smooth', label: 'Smooth', icon: Waves },
  { type: 'sharpen', label: 'Sharpen', icon: Triangle },
  { type: 'pinch', label: 'Pinch', icon: Minimize },
  { type: 'inflate', label: 'Inflate', icon: Maximize },
];

export const SculptToolbar: React.FC<SculptToolbarProps> = ({
  brushOptions,
  onChangeOptions,
  onClose,
}) => {
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-xs pointer-events-auto select-none">
      {/* Tool Buttons */}
      <div className="flex items-center gap-1 pr-3 border-r border-zinc-200 dark:border-zinc-800">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = brushOptions.tool === tool.type;
          return (
            <button
              key={tool.type}
              onClick={() => onChangeOptions({ tool: tool.type })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title={tool.label}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Radius Slider */}
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">Radius:</span>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={brushOptions.radius}
          onChange={(e) => onChangeOptions({ radius: Number(e.target.value) })}
          className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
        />
        <span className="font-mono text-zinc-800 dark:text-zinc-200 w-9 text-right font-semibold">
          {brushOptions.radius}px
        </span>
      </div>

      {/* Strength Slider */}
      <div className="flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-zinc-800">
        <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">Strength:</span>
        <input
          type="range"
          min={0.05}
          max={1.0}
          step={0.05}
          value={brushOptions.strength}
          onChange={(e) => onChangeOptions({ strength: Number(e.target.value) })}
          className="w-20 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-800 dark:accent-zinc-200"
        />
        <span className="font-mono text-zinc-800 dark:text-zinc-200 w-8 text-right font-semibold">
          {Math.round(brushOptions.strength * 100)}%
        </span>
      </div>

      {/* Close Sculpt Mode */}
      <button
        onClick={onClose}
        className="ml-1 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        title="Close Sculpt Mode"
      >
        ✕
      </button>
    </div>
  );
};
