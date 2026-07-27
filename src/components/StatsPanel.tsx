import React from 'react';
import { BarChart3 } from 'lucide-react';
import { PipelineStats } from '../svg/stats';

interface StatsPanelProps {
  stats: PipelineStats | null;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
        <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
        <span>Pipeline Diagnostics & Stats</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono">
        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Components:</span>
          <span className="text-zinc-800 dark:text-zinc-200">{stats.componentsCount}</span>
        </div>

        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Contours / Holes:</span>
          <span className="text-zinc-800 dark:text-zinc-200">
            {stats.contoursCount} / {stats.holesCount}
          </span>
        </div>

        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Raw Points:</span>
          <span className="text-zinc-800 dark:text-zinc-200">{stats.rawPointsCount}</span>
        </div>

        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Retained Points:</span>
          <span className="text-zinc-800 dark:text-zinc-200">
            {stats.retainedPointsCount} ({stats.reductionPercentage}%)
          </span>
        </div>

        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Bézier Segments:</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-bold">{stats.bezierSegmentsCount}</span>
        </div>

        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Commands / Bytes:</span>
          <span className="text-zinc-800 dark:text-zinc-200">
            {stats.pathCommandsCount} ({Math.round((stats.svgByteSize / 1024) * 10) / 10} KB)
          </span>
        </div>

        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Max Fit Error:</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{stats.maxMeasuredErrorPx} px</span>
        </div>

        <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
          <span className="text-zinc-500 dark:text-zinc-500">Mean Fit Error:</span>
          <span className="text-zinc-800 dark:text-zinc-200">{stats.meanMeasuredErrorPx} px</span>
        </div>
      </div>
    </div>
  );
};
