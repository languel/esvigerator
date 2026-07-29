import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, MousePointer2, Palette, Wand2 } from 'lucide-react';
import { Point, CubicBezier } from '../geometry/point';
import { ContourNode } from '../contours/findContours';
import { SplitView } from './SplitView';
import { SculptToolbar } from './SculptToolbar';
import {
  SculptBrushOptions,
  applyGrabBrush,
  applySmoothBrush,
  applySharpenBrush,
  applyPinchBrush,
} from '../geometry/sculpt';

export type ViewMode =
  | 'original'
  | 'mask'
  | 'contourSamples'
  | 'simplified'
  | 'fittedVector'
  | 'overlay'
  | 'split';

export type SplitMode = 'origMask' | 'origVector' | 'maskVector';

export interface OverlayColors {
  anchorColor: string;
  handleColor: string;
  handleLineColor: string;
  retainedPointColor: string;
  rawPointColor: string;
}

interface PreviewWorkspaceProps {
  sourceImage: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;
  contours: ContourNode[];
  simplifiedPoints: Point[][];
  bezierGroups: CubicBezier[][];
  onUpdateBezierGroups: (newGroups: CubicBezier[][]) => void;
  svgString: string;
  width: number;
  height: number;
}

const DEFAULT_OVERLAY_COLORS: OverlayColors = {
  anchorColor: '#ef4444',
  handleColor: '#3b82f6',
  handleLineColor: '#60a5fa',
  retainedPointColor: '#10b981',
  rawPointColor: '#a1a1aa',
};

const COLOR_PRESETS = [
  { label: 'Red / Blue (Default)', anchor: '#ef4444', handle: '#3b82f6', line: '#60a5fa' },
  { label: 'Monochrome Black/White', anchor: '#ffffff', handle: '#71717a', line: '#a1a1aa' },
  { label: 'Emerald / Gold', anchor: '#10b981', handle: '#f59e0b', line: '#fbbf24' },
  { label: 'Neon Pink / Cyan', anchor: '#ec4899', handle: '#06b6d4', line: '#67e8f9' },
  { label: 'Violet / Orange', anchor: '#8b5cf6', handle: '#f97316', line: '#fb923c' },
];

export const PreviewWorkspace: React.FC<PreviewWorkspaceProps> = ({
  sourceImage,
  maskCanvas,
  contours,
  simplifiedPoints,
  bezierGroups,
  onUpdateBezierGroups,
  svgString,
  width,
  height,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('fittedVector');
  const [splitMode, setSplitMode] = useState<SplitMode>('origVector');

  // Interactive Modes
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSculptMode, setIsSculptMode] = useState(false);
  const [sculptOptions, setSculptOptions] = useState<SculptBrushOptions>({
    tool: 'grab',
    radius: 40,
    strength: 0.35,
  });

  const [mouseCanvasPos, setMouseCanvasPos] = useState<Point | null>(null);

  const [activeNode, setActiveNode] = useState<{
    groupIdx: number;
    segIdx: number;
    pointType: 'p0' | 'c1' | 'c2' | 'p1';
  } | null>(null);

  // Overlay Color Settings
  const [overlayColors, setOverlayColors] = useState<OverlayColors>(DEFAULT_OVERLAY_COLORS);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const isDraggingNode = useRef(false);
  const isSculpting = useRef(false);
  const prevSculptPos = useRef<Point | null>(null);

  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragInitialPoints = useRef<{ p0: Point; c1: Point; c2: Point; p1: Point } | null>(null);

  const startPan = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  // Overlay toggles
  const [showRawPoints, setShowRawPoints] = useState(false);
  const [showRetainedPoints, setShowRetainedPoints] = useState(false);
  const [showBezierHandles, setShowBezierHandles] = useState(true);
  const [showBounds, setShowBounds] = useState(false);

  const resetTransform = useCallback(() => {
    if (!containerRef.current || width <= 0 || height <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = (rect.width - 40) / width;
    const scaleY = (rect.height - 40) / height;
    const initialZoom = Math.min(scaleX, scaleY, 1);
    setZoom(initialZoom);
    setPan({
      x: (rect.width - width * initialZoom) / 2,
      y: (rect.height - height * initialZoom) / 2,
    });
  }, [width, height]);

  useEffect(() => {
    resetTransform();
  }, [width, height, resetTransform]);

  // Smooth, non-choppy pinch & wheel zoom with requestAnimationFrame batching
  const handleWheelNative = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const dy = e.deltaY;
      const modeFactor = e.ctrlKey ? 0.008 : 0.0018;
      const factor = Math.exp(-dy * modeFactor);

      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        setZoom((prevZoom) => {
          const newZoom = Math.max(0.05, Math.min(100, prevZoom * factor));
          setPan((prevPan) => ({
            x: mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom),
            y: mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom),
          }));
          return newZoom;
        });
        rafId.current = null;
      });
    },
    []
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheelNative);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [handleWheelNative]);

  // Hit testing for nodes & handles in Edit Mode
  const findNodeAtMouse = (clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const svgX = (clientX - rect.left - pan.x) / zoom;
    const svgY = (clientY - rect.top - pan.y) / zoom;
    const hitRadius = Math.max(6, 12 / zoom);

    for (let g = 0; g < bezierGroups.length; g++) {
      const group = bezierGroups[g];
      for (let s = 0; s < group.length; s++) {
        const seg = group[s];

        if (Math.hypot(seg.c1.x - svgX, seg.c1.y - svgY) <= hitRadius) {
          return { groupIdx: g, segIdx: s, pointType: 'c1' as const };
        }
        if (Math.hypot(seg.c2.x - svgX, seg.c2.y - svgY) <= hitRadius) {
          return { groupIdx: g, segIdx: s, pointType: 'c2' as const };
        }
        if (Math.hypot(seg.p0.x - svgX, seg.p0.y - svgY) <= hitRadius) {
          return { groupIdx: g, segIdx: s, pointType: 'p0' as const };
        }
        if (Math.hypot(seg.p1.x - svgX, seg.p1.y - svgY) <= hitRadius) {
          return { groupIdx: g, segIdx: s, pointType: 'p1' as const };
        }
      }
    }
    return null;
  };

  // Convert mouse screen coordinates to image canvas space
  const getCanvasCoords = (clientX: number, clientY: number): Point | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Mouse Handlers for Pan, Node Dragging, and Vector Sculpting
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, select, input, .pointer-events-auto')) return;

    const imgCoords = getCanvasCoords(e.clientX, e.clientY);

    // Sculpt Mode Dragging
    if (isSculptMode && imgCoords) {
      isSculpting.current = true;
      prevSculptPos.current = imgCoords;
      return;
    }

    // Edit Nodes Dragging
    if (isEditMode && showBezierHandles) {
      const hit = findNodeAtMouse(e.clientX, e.clientY);
      if (hit) {
        isDraggingNode.current = true;
        setActiveNode(hit);
        dragStartMouse.current = { x: e.clientX, y: e.clientY };

        const seg = bezierGroups[hit.groupIdx][hit.segIdx];
        dragInitialPoints.current = {
          p0: { ...seg.p0 },
          c1: { ...seg.c1 },
          c2: { ...seg.c2 },
          p1: { ...seg.p1 },
        };
        return;
      }
    }

    isPanning.current = true;
    startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const imgCoords = getCanvasCoords(e.clientX, e.clientY);
    setMouseCanvasPos(imgCoords);

    // Perform Vector Sculpting Brush Operations
    if (isSculpting.current && isSculptMode && imgCoords && prevSculptPos.current) {
      let updated = bezierGroups;
      const { tool, radius, strength } = sculptOptions;

      if (tool === 'grab') {
        updated = applyGrabBrush(updated, prevSculptPos.current, imgCoords, radius, strength);
      } else if (tool === 'smooth') {
        updated = applySmoothBrush(updated, imgCoords, radius, strength);
      } else if (tool === 'sharpen') {
        updated = applySharpenBrush(updated, imgCoords, radius, strength);
      } else if (tool === 'pinch') {
        updated = applyPinchBrush(updated, imgCoords, radius, strength, false);
      } else if (tool === 'inflate') {
        updated = applyPinchBrush(updated, imgCoords, radius, strength, true);
      }

      prevSculptPos.current = imgCoords;
      onUpdateBezierGroups(updated);
      return;
    }

    // Node Dragging
    if (isDraggingNode.current && activeNode && dragInitialPoints.current) {
      const dx = (e.clientX - dragStartMouse.current.x) / zoom;
      const dy = (e.clientY - dragStartMouse.current.y) / zoom;

      const { groupIdx, segIdx, pointType } = activeNode;
      const init = dragInitialPoints.current;

      const newGroups = bezierGroups.map((grp, g) =>
        grp.map((seg, s) => {
          if (g !== groupIdx || s !== segIdx) return seg;

          const updated = { ...seg };

          if (pointType === 'p0') {
            updated.p0 = { x: init.p0.x + dx, y: init.p0.y + dy };
            updated.c1 = { x: init.c1.x + dx, y: init.c1.y + dy };
          } else if (pointType === 'c1') {
            updated.c1 = { x: init.c1.x + dx, y: init.c1.y + dy };
          } else if (pointType === 'c2') {
            updated.c2 = { x: init.c2.x + dx, y: init.c2.y + dy };
          } else if (pointType === 'p1') {
            updated.p1 = { x: init.p1.x + dx, y: init.p1.y + dy };
            updated.c2 = { x: init.c2.x + dx, y: init.c2.y + dy };
          }

          return updated;
        })
      );

      if (pointType === 'p0' && segIdx > 0) {
        const prevSeg = newGroups[groupIdx][segIdx - 1];
        prevSeg.p1 = { ...newGroups[groupIdx][segIdx].p0 };
      } else if (pointType === 'p1' && segIdx < newGroups[groupIdx].length - 1) {
        const nextSeg = newGroups[groupIdx][segIdx + 1];
        nextSeg.p0 = { ...newGroups[groupIdx][segIdx].p1 };
      }

      onUpdateBezierGroups(newGroups);
      return;
    }

    if (!isPanning.current) return;
    setPan({
      x: e.clientX - startPan.current.x,
      y: e.clientY - startPan.current.y,
    });
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    isDraggingNode.current = false;
    isSculpting.current = false;
    prevSculptPos.current = null;
  };

  // Layer Renderers
  const renderSourceImage = () => {
    if (!sourceImage) return null;
    return (
      <img
        src={sourceImage.src}
        alt="Source"
        style={{ width, height }}
        className="max-w-none pointer-events-none"
      />
    );
  };

  const renderMaskCanvas = () => {
    if (!maskCanvas) return null;
    return (
      <img
        src={maskCanvas.toDataURL()}
        alt="Mask"
        style={{ width, height }}
        className="max-w-none pointer-events-none image-rendering-pixelated"
      />
    );
  };

  const renderVectorSvg = () => {
    if (!svgString) return null;
    return (
      <div
        dangerouslySetInnerHTML={{ __html: svgString }}
        style={{ width, height }}
        className="pointer-events-none"
      />
    );
  };

  const renderOverlays = () => {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width, height }}
        className="absolute inset-0 pointer-events-none overflow-visible"
      >
        {/* Sculpt Brush Cursor Overlay */}
        {isSculptMode && mouseCanvasPos && (
          <circle
            cx={mouseCanvasPos.x}
            cy={mouseCanvasPos.y}
            r={sculptOptions.radius}
            fill="rgba(59, 130, 246, 0.08)"
            stroke="#3b82f6"
            strokeWidth={1.5 / zoom}
            strokeDasharray={`${4 / zoom},${4 / zoom}`}
          />
        )}

        {/* Raw Points */}
        {showRawPoints &&
          contours.map((c, i) => (
            <g key={`raw-${i}`}>
              {c.points.map((p, j) => (
                <circle
                  key={`raw-pt-${j}`}
                  cx={p.x}
                  cy={p.y}
                  r={Math.max(0.5, 1.5 / zoom)}
                  fill={overlayColors.rawPointColor}
                  opacity={0.7}
                />
              ))}
            </g>
          ))}

        {/* Retained Simplified Points */}
        {showRetainedPoints &&
          simplifiedPoints.map((pts, i) => (
            <g key={`simp-${i}`}>
              {pts.map((p, j) => (
                <circle
                  key={`simp-pt-${j}`}
                  cx={p.x}
                  cy={p.y}
                  r={Math.max(1, 2.5 / zoom)}
                  fill={overlayColors.retainedPointColor}
                  stroke="#18181b"
                  strokeWidth={0.5 / zoom}
                />
              ))}
            </g>
          ))}

        {/* Bézier Anchors & Control Handles */}
        {showBezierHandles &&
          bezierGroups.map((group, gIdx) => (
            <g key={`bez-group-${gIdx}`}>
              {group.map((seg, sIdx) => {
                const isActiveP0 = activeNode?.groupIdx === gIdx && activeNode?.segIdx === sIdx && activeNode?.pointType === 'p0';
                const isActiveC1 = activeNode?.groupIdx === gIdx && activeNode?.segIdx === sIdx && activeNode?.pointType === 'c1';
                const isActiveC2 = activeNode?.groupIdx === gIdx && activeNode?.segIdx === sIdx && activeNode?.pointType === 'c2';
                const isActiveP1 = activeNode?.groupIdx === gIdx && activeNode?.segIdx === sIdx && activeNode?.pointType === 'p1';

                return (
                  <g key={`bez-seg-${sIdx}`}>
                    {/* Handle Lines */}
                    <line
                      x1={seg.p0.x}
                      y1={seg.p0.y}
                      x2={seg.c1.x}
                      y2={seg.c1.y}
                      stroke={overlayColors.handleLineColor}
                      strokeWidth={0.9 / zoom}
                      strokeDasharray={`${2.5 / zoom},${2.5 / zoom}`}
                    />
                    <line
                      x1={seg.p1.x}
                      y1={seg.p1.y}
                      x2={seg.c2.x}
                      y2={seg.c2.y}
                      stroke={overlayColors.handleLineColor}
                      strokeWidth={0.9 / zoom}
                      strokeDasharray={`${2.5 / zoom},${2.5 / zoom}`}
                    />

                    {/* Control Handles (C1, C2) */}
                    <circle
                      cx={seg.c1.x}
                      cy={seg.c1.y}
                      r={isActiveC1 ? Math.max(3, 5 / zoom) : Math.max(1.5, 2.8 / zoom)}
                      fill={overlayColors.handleColor}
                      stroke="#ffffff"
                      strokeWidth={0.6 / zoom}
                      className={isEditMode ? 'cursor-move' : ''}
                    />
                    <circle
                      cx={seg.c2.x}
                      cy={seg.c2.y}
                      r={isActiveC2 ? Math.max(3, 5 / zoom) : Math.max(1.5, 2.8 / zoom)}
                      fill={overlayColors.handleColor}
                      stroke="#ffffff"
                      strokeWidth={0.6 / zoom}
                      className={isEditMode ? 'cursor-move' : ''}
                    />

                    {/* Anchor Points (P0, P1) */}
                    <circle
                      cx={seg.p0.x}
                      cy={seg.p0.y}
                      r={isActiveP0 ? Math.max(4, 6 / zoom) : Math.max(2, 3.5 / zoom)}
                      fill={overlayColors.anchorColor}
                      stroke="#ffffff"
                      strokeWidth={0.8 / zoom}
                      className={isEditMode ? 'cursor-move' : ''}
                    />
                    <circle
                      cx={seg.p1.x}
                      cy={seg.p1.y}
                      r={isActiveP1 ? Math.max(4, 6 / zoom) : Math.max(2, 3.5 / zoom)}
                      fill={overlayColors.anchorColor}
                      stroke="#ffffff"
                      strokeWidth={0.8 / zoom}
                      className={isEditMode ? 'cursor-move' : ''}
                    />
                  </g>
                );
              })}
            </g>
          ))}

        {/* Component Bounds */}
        {showBounds &&
          contours.map((c, i) => (
            <rect
              key={`bnd-${i}`}
              x={c.bounds.minX}
              y={c.bounds.minY}
              width={c.bounds.width}
              height={c.bounds.height}
              fill="none"
              stroke="#a1a1aa"
              strokeWidth={1 / zoom}
              strokeDasharray={`${3 / zoom},${3 / zoom}`}
            />
          ))}
      </svg>
    );
  };

  const renderSingleContent = () => {
    switch (viewMode) {
      case 'original':
        return renderSourceImage();
      case 'mask':
        return renderMaskCanvas();
      case 'fittedVector':
        return renderVectorSvg();
      case 'overlay':
        return (
          <div className="relative" style={{ width, height }}>
            {renderSourceImage()}
            <div className="absolute inset-0 opacity-80">{renderVectorSvg()}</div>
          </div>
        );
      default:
        return renderVectorSvg();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative flex-1 bg-zinc-100 dark:bg-zinc-950 overflow-hidden select-none ${
        isSculptMode
          ? 'cursor-crosshair'
          : isEditMode
          ? 'cursor-crosshair'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Floating Sculpt Toolbar */}
      {isSculptMode && (
        <SculptToolbar
          brushOptions={sculptOptions}
          onChangeOptions={(opt) => setSculptOptions((prev) => ({ ...prev, ...opt }))}
          onClose={() => setIsSculptMode(false)}
        />
      )}

      {/* Top Workspace Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 pointer-events-auto shadow-lg">
          {(
            [
              ['fittedVector', 'Fitted Vector'],
              ['original', 'Original'],
              ['mask', 'Mask'],
              ['overlay', 'Overlay'],
              ['split', 'Split View'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === mode
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}

          {viewMode === 'split' && (
            <select
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as SplitMode)}
              className="ml-2 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-800 px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="origVector">Original vs Vector</option>
              <option value="origMask">Original vs Mask</option>
              <option value="maskVector">Mask vs Vector</option>
            </select>
          )}
        </div>

        {/* Sculpt Mode, Edit Mode, Overlay Toggles & Color Picker Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Vector Sculpt Brushes Mode Button */}
          <button
            onClick={() => {
              setIsSculptMode(!isSculptMode);
              if (!isSculptMode) setIsEditMode(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-md ${
              isSculptMode
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-lg'
                : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title="Toggle Blender-Style Vector Sculpt Brushes Mode"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isSculptMode ? 'Sculpt Mode On' : 'Sculpt Brushes'}</span>
          </button>

          {/* Edit Nodes Mode Button */}
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              if (!isEditMode) setIsSculptMode(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-md ${
              isEditMode
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title="Toggle Edit Vector Nodes & Handles Mode"
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Editing Nodes On' : 'Edit Nodes'}</span>
          </button>

          {/* Overlay Visibility Buttons */}
          <div className="flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg text-xs">
            <button
              onClick={() => setShowBezierHandles(!showBezierHandles)}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                showBezierHandles
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Toggle Bézier Handles"
            >
              Handles
            </button>
            <button
              onClick={() => setShowRetainedPoints(!showRetainedPoints)}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                showRetainedPoints
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Toggle Retained Points"
            >
              Points
            </button>
            <button
              onClick={() => setShowRawPoints(!showRawPoints)}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                showRawPoints
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Toggle Raw Contour Points"
            >
              Raw
            </button>
            <button
              onClick={() => setShowBounds(!showBounds)}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                showBounds
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Toggle Bounding Boxes"
            >
              Bounds
            </button>

            {/* Custom Overlay Colors Dropdown */}
            <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-1 ml-0.5">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer flex items-center gap-1"
                title="Customize Overlay Node & Handle Colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block border border-zinc-400"
                  style={{ backgroundColor: overlayColors.anchorColor }}
                />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-8 w-64 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl space-y-3 z-50 text-xs">
                  <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100 pb-1 border-b border-zinc-200 dark:border-zinc-800">
                    <span>Overlay Colors</span>
                    <button
                      onClick={() => setShowColorPicker(false)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Color Pickers */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Anchor Points</span>
                      <input
                        type="color"
                        value={overlayColors.anchorColor}
                        onChange={(e) => setOverlayColors((c) => ({ ...c, anchorColor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-transparent p-0"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Control Handles</span>
                      <input
                        type="color"
                        value={overlayColors.handleColor}
                        onChange={(e) => setOverlayColors((c) => ({ ...c, handleColor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-transparent p-0"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Handle Lines</span>
                      <input
                        type="color"
                        value={overlayColors.handleLineColor}
                        onChange={(e) => setOverlayColors((c) => ({ ...c, handleLineColor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-transparent p-0"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Retained Points</span>
                      <input
                        type="color"
                        value={overlayColors.retainedPointColor}
                        onChange={(e) => setOverlayColors((c) => ({ ...c, retainedPointColor: e.target.value }))}
                        className="w-6 h-6 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-transparent p-0"
                      />
                    </div>
                  </div>

                  {/* Quick Color Presets */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="block text-[10px] text-zinc-400 mb-1">Theme Presets</span>
                    <div className="space-y-1">
                      {COLOR_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            setOverlayColors({
                              anchorColor: p.anchor,
                              handleColor: p.handle,
                              handleLineColor: p.line,
                              retainedPointColor: p.handle,
                              rawPointColor: '#a1a1aa',
                            })
                          }
                          className="w-full flex items-center justify-between px-2 py-1 rounded bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer"
                        >
                          <span>{p.label}</span>
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.anchor }} />
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.handle }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg gap-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.05, z * 0.8))}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 px-2 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(100, z * 1.25))}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetTransform}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 transition cursor-pointer"
              title="100% Zoom"
            >
              1:1
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Workspace View */}
      {viewMode === 'split' ? (
        <SplitView
          leftContent={
            <div
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transformOrigin: '0 0',
                width,
                height,
              }}
              className="relative shadow-2xl bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
            >
              {splitMode === 'origMask'
                ? renderSourceImage()
                : splitMode === 'origVector'
                ? renderSourceImage()
                : renderMaskCanvas()}
            </div>
          }
          rightContent={
            <div
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                transformOrigin: '0 0',
                width,
                height,
              }}
              className="relative shadow-2xl bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
            >
              {splitMode === 'origMask'
                ? renderMaskCanvas()
                : splitMode === 'origVector'
                ? renderVectorSvg()
                : renderVectorSvg()}
              {renderOverlays()}
            </div>
          }
          leftLabel={splitMode === 'origMask' ? 'Original' : splitMode === 'origVector' ? 'Original' : 'Mask'}
          rightLabel={splitMode === 'origMask' ? 'Mask' : 'Vector SVG'}
        />
      ) : (
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
            width,
            height,
          }}
          className="relative shadow-2xl bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
        >
          {renderSingleContent()}
          {renderOverlays()}
        </div>
      )}
    </div>
  );
};
