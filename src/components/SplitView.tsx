import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SplitViewProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}

export const SplitView: React.FC<SplitViewProps> = ({
  leftContent,
  rightContent,
  leftLabel = 'Left',
  rightLabel = 'Right',
}) => {
  const [splitPos, setSplitPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSplitPos(pct);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
    >
      {/* Left Pane */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
      >
        {leftContent}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 pointer-events-none shadow-xs">
          {leftLabel}
        </div>
      </div>

      {/* Right Pane */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` }}
      >
        {rightContent}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 pointer-events-none shadow-xs">
          {rightLabel}
        </div>
      </div>

      {/* Divider Bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{ left: `${splitPos}%` }}
        className="absolute top-0 bottom-0 w-2.5 bg-transparent hover:bg-zinc-400/20 cursor-ew-resize z-30 transform -translate-x-1/2 flex items-center justify-center pointer-events-auto"
      >
        <div className="w-0.5 h-full bg-zinc-400 dark:bg-zinc-500 shadow-sm" />
        <div className="absolute w-5 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 flex items-center justify-center text-[10px] shadow-md font-bold pointer-events-none">
          ↔
        </div>
      </div>
    </div>
  );
};
