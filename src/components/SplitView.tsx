import React, { useState, useRef, useCallback } from 'react';

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

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPos(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full overflow-hidden select-none"
    >
      {/* Left Pane */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
      >
        {leftContent}
        <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-zinc-300 border border-zinc-800 pointer-events-none">
          {leftLabel}
        </div>
      </div>

      {/* Right Pane */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)` }}
      >
        {rightContent}
        <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-zinc-300 border border-zinc-800 pointer-events-none">
          {rightLabel}
        </div>
      </div>

      {/* Divider Bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{ left: `${splitPos}%` }}
        className="absolute top-0 bottom-0 w-1 bg-indigo-500 hover:w-1.5 cursor-ew-resize z-30 transform -translate-x-1/2 flex items-center justify-center shadow-lg"
      >
        <div className="w-4 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shadow">
          ↔
        </div>
      </div>
    </div>
  );
};
