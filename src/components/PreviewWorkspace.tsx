import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Point, CubicBezier } from '../geometry/point';
import { ContourNode } from '../contours/findContours';
import { SplitView } from './SplitView';

export type ViewMode =
  | 'original'
  | 'mask'
  | 'contourSamples'
  | 'simplified'
  | 'fittedVector'
  | 'overlay'
  | 'split';

export type SplitMode = 'origMask' | 'origVector' | 'maskVector';

interface PreviewWorkspaceProps {
  sourceImage: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;
  contours: ContourNode[];
  simplifiedPoints: Point[][];
  bezierGroups: CubicBezier[][];
  svgString: string;
  width: number;
  height: number;
}

export const PreviewWorkspace: React.FC<PreviewWorkspaceProps> = ({
  sourceImage,
  maskCanvas,
  contours,
  simplifiedPoints,
  bezierGroups,
  svgString,
  width,
  height,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('fittedVector');
  const [splitMode, setSplitMode] = useState<SplitMode>('origVector');

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(0.1, Math.min(50, zoom * zoomFactor));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prevPan.y) * (newZoom / zoom),
      }));
    }

    setZoom(newZoom);
  };

  // Mouse pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setPan({
      x: e.clientX - startPan.current.x,
      y: e.clientY - startPan.current.y,
    });
  };

  const handleMouseUp = () => {
    isPanning.current = false;
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
                  fill="#71717a"
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
                  fill="#a1a1aa"
                  stroke="#18181b"
                  strokeWidth={0.5 / zoom}
                />
              ))}
            </g>
          ))}

        {/* Bézier Anchors & Control Handles */}
        {showBezierHandles &&
          bezierGroups.map((group, i) => (
            <g key={`bez-group-${i}`}>
              {group.map((seg, j) => (
                <g key={`bez-seg-${j}`}>
                  {/* Handle Lines */}
                  <line
                    x1={seg.p0.x}
                    y1={seg.p0.y}
                    x2={seg.c1.x}
                    y2={seg.c1.y}
                    stroke="#a1a1aa"
                    strokeWidth={0.8 / zoom}
                    strokeDasharray={`${2 / zoom},${2 / zoom}`}
                  />
                  <line
                    x1={seg.p1.x}
                    y1={seg.p1.y}
                    x2={seg.c2.x}
                    y2={seg.c2.y}
                    stroke="#a1a1aa"
                    strokeWidth={0.8 / zoom}
                    strokeDasharray={`${2 / zoom},${2 / zoom}`}
                  />
                  {/* Control Handles */}
                  <circle
                    cx={seg.c1.x}
                    cy={seg.c1.y}
                    r={Math.max(1, 2 / zoom)}
                    fill="#71717a"
                  />
                  <circle
                    cx={seg.c2.x}
                    cy={seg.c2.y}
                    r={Math.max(1, 2 / zoom)}
                    fill="#71717a"
                  />
                  {/* Anchor Points */}
                  <circle
                    cx={seg.p0.x}
                    cy={seg.p0.y}
                    r={Math.max(1.5, 3 / zoom)}
                    fill="#27272a"
                    stroke="#f4f4f5"
                    strokeWidth={0.5 / zoom}
                  />
                </g>
              ))}
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
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 bg-zinc-100 dark:bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
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

        {/* Overlay Toggles & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
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
          </div>

          <div className="flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg gap-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.1, z * 0.8))}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 px-2 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(50, z * 1.25))}
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
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
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
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
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
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
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
