import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { SourcePanel } from '../components/SourcePanel';
import { ThresholdPanel } from '../components/ThresholdPanel';
import { CleanupPanel } from '../components/CleanupPanel';
import { ContourPanel } from '../components/ContourPanel';
import { SamplingPanel } from '../components/SamplingPanel';
import { FittingPanel } from '../components/FittingPanel';
import { ExportPanel } from '../components/ExportPanel';
import { StatsPanel } from '../components/StatsPanel';
import { PreviewWorkspace } from '../components/PreviewWorkspace';
import { DropZone } from '../components/DropZone';
import { DEFAULT_TRACE_SETTINGS, PRESETS } from './defaults';
import { HistoryTracker } from './history';
import { TraceSettings, WorkerRequest, WorkerResponse } from '../workers/protocol';
import { renderSvgToPngBlob } from '../svg/exportSvg';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<TraceSettings>(DEFAULT_TRACE_SETTINGS);
  const [activePreset, setActivePreset] = useState<string>('Clean line art');
  const historyRef = useRef<HistoryTracker>(new HistoryTracker(DEFAULT_TRACE_SETTINGS));

  // Loaded Image state
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [filename, setFilename] = useState<string>('');

  // Worker output state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [workerResult, setWorkerResult] = useState<WorkerResponse['result'] | null>(null);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);

  // Worker instance
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/trace.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const resp = e.data;
      setIsProcessing(false);

      if (resp.status === 'success' && resp.result) {
        setWorkerResult(resp.result);

        // Render binary mask canvas
        const cvs = document.createElement('canvas');
        cvs.width = resp.result.width;
        cvs.height = resp.result.height;
        const ctx = cvs.getContext('2d');
        if (ctx) {
          const imgData = ctx.createImageData(resp.result.width, resp.result.height);
          const maskBytes = new Uint8Array(resp.result.maskData);
          for (let i = 0; i < maskBytes.length; i++) {
            const val = maskBytes[i];
            imgData.data[i * 4] = val;
            imgData.data[i * 4 + 1] = val;
            imgData.data[i * 4 + 2] = val;
            imgData.data[i * 4 + 3] = 255;
          }
          ctx.putImageData(imgData, 0, 0);
          setMaskCanvas(cvs);
        }
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Dispatch processing job to worker
  const dispatchTrace = useCallback((img: HTMLImageElement, currentSettings: TraceSettings) => {
    if (!workerRef.current) return;
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    const maxDim = currentSettings.source.maxDimension;
    if (maxDim > 0 && (targetW > maxDim || targetH > maxDim)) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * maxDim) / targetW);
        targetW = maxDim;
      } else {
        targetW = Math.round((targetW * maxDim) / targetH);
        targetH = maxDim;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, targetW, targetH);
    const imgData = ctx.getImageData(0, 0, targetW, targetH);

    const req: WorkerRequest = {
      id: Math.random().toString(36).slice(2),
      action: 'trace',
      imageData: {
        width: targetW,
        height: targetH,
        data: imgData.data.buffer.slice(0),
      },
      settings: currentSettings,
    };

    workerRef.current.postMessage(req, [req.imageData.data]);
  }, []);

  // Trigger trace when image or settings change
  useEffect(() => {
    if (sourceImage) {
      dispatchTrace(sourceImage, settings);
    }
  }, [sourceImage, settings, dispatchTrace]);

  // Load Image helper
  const loadImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          setFilename(file.name);
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const loadExampleNeuron = () => {
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      setFilename('neuroon-src.png');
    };
    img.src = '/examples/neuroon-src.png';
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          loadImageFromFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Update Settings with Undo History tracking
  const updateSettings = (updater: (prev: TraceSettings) => TraceSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      historyRef.current.push(next);
      return next;
    });
  };

  const handleSelectPreset = (presetName: string) => {
    if (PRESETS[presetName]) {
      setActivePreset(presetName);
      updateSettings(() => PRESETS[presetName]);
    }
  };

  const handleUndo = () => {
    const prev = historyRef.current.undo();
    if (prev) setSettings(prev);
  };

  const handleRedo = () => {
    const next = historyRef.current.redo();
    if (next) setSettings(next);
  };

  const handleReset = () => {
    updateSettings(() => DEFAULT_TRACE_SETTINGS);
    setActivePreset('Clean line art');
  };

  // Export Actions
  const handleCopySvg = () => {
    if (workerResult?.svgString) {
      navigator.clipboard.writeText(workerResult.svgString);
    }
  };

  const handleExportSvg = () => {
    if (!workerResult?.svgString) return;
    const blob = new Blob([workerResult.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ? `${filename.replace(/\.[^/.]+$/, '')}-traced.svg` : 'traced.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async () => {
    if (!workerResult?.svgString) return;
    const blob = await renderSvgToPngBlob(
      workerResult.svgString,
      workerResult.width,
      workerResult.height
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ? `${filename.replace(/\.[^/.]+$/, '')}-preview.png` : 'preview.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <TopBar
        onOpenImage={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e: any) => {
            if (e.target.files?.[0]) loadImageFromFile(e.target.files[0]);
          };
          input.click();
        }}
        onLoadExample={loadExampleNeuron}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyRef.current.canUndo()}
        canRedo={historyRef.current.canRedo()}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        onExportSvg={handleExportSvg}
        onExportPng={handleExportPng}
        onCopySvg={handleCopySvg}
        isProcessing={isProcessing}
        filename={filename}
      />

      {/* Main 3-Column Desktop Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Source, Threshold, Cleanup, Contour Panels */}
        <aside className="w-80 border-r border-zinc-800 bg-zinc-900/60 overflow-y-auto shrink-0 flex flex-col">
          <SourcePanel
            settings={settings.source}
            onChange={(s) => updateSettings((prev) => ({ ...prev, source: { ...prev.source, ...s } }))}
          />
          <ThresholdPanel
            settings={settings.threshold}
            onChange={(t) => updateSettings((prev) => ({ ...prev, threshold: { ...prev.threshold, ...t } }))}
          />
          <CleanupPanel
            settings={settings.cleanup}
            onChange={(c) => updateSettings((prev) => ({ ...prev, cleanup: { ...prev.cleanup, ...c } }))}
          />
          <ContourPanel
            settings={settings.contours}
            onChange={(cnt) => updateSettings((prev) => ({ ...prev, contours: { ...prev.contours, ...cnt } }))}
          />
        </aside>

        {/* Center Column: Interactive Preview Workspace or DropZone */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
          {sourceImage && workerResult ? (
            <PreviewWorkspace
              sourceImage={sourceImage}
              maskCanvas={maskCanvas}
              contours={workerResult.contours}
              simplifiedPoints={workerResult.simplifiedPoints}
              bezierGroups={workerResult.bezierGroups}
              svgString={workerResult.svgString}
              width={workerResult.width}
              height={workerResult.height}
            />
          ) : (
            <DropZone
              onImageSelected={loadImageFromFile}
              onLoadExample={loadExampleNeuron}
            />
          )}
        </main>

        {/* Right Column: Fitting, Sampling, Export, Stats Panels */}
        <aside className="w-80 border-l border-zinc-800 bg-zinc-900/60 overflow-y-auto shrink-0 flex flex-col">
          <FittingPanel
            settings={settings.fitting}
            onChange={(f) => updateSettings((prev) => ({ ...prev, fitting: { ...prev.fitting, ...f } }))}
          />
          <SamplingPanel
            settings={settings.sampling}
            onChange={(s) => updateSettings((prev) => ({ ...prev, sampling: { ...prev.sampling, ...s } }))}
          />
          <StatsPanel stats={workerResult?.stats ?? null} />
          <ExportPanel
            settings={settings.export}
            onChange={(e) => updateSettings((prev) => ({ ...prev, export: { ...prev.export, ...e } }))}
            onCopySvg={handleCopySvg}
            onExportSvg={handleExportSvg}
          />
        </aside>
      </div>
    </div>
  );
};
