import { WorkerRequest, WorkerResponse } from './protocol';
import { applyGrayscale, applyThreshold, filterConnectedComponents } from '../image/imageProcessing';
import { findContours } from '../contours/findContours';
import { zhangSuenThinning, extractSkeletonChains } from '../contours/skeleton';
import { fitCenterlineChains } from '../fitting/centerline';
import { simplifyDouglasPeucker } from '../contours/simplifyDouglasPeucker';
import { resampleArcLength } from '../contours/resampleArcLength';
import { smoothPoints } from '../contours/smoothing';
import { fitCurve } from '../fitting/cubicFit/fitCurve';
import { catmullRomClosedToCubics } from '../fitting/catmullRom';
import { pointsToPolygonPath } from '../fitting/polygon';
import { tracePotrace } from '../fitting/potrace';
import { serializeCubicBeziersToPath } from '../svg/serializePath';
import { generateSvgDocument } from '../svg/exportSvg';
import { computePipelineStats } from '../svg/stats';
import { Point, CubicBezier } from '../geometry/point';
import { computeOverallError } from '../fitting/cubicFit/computeError';

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  if (req.action !== 'trace') return;

  try {
    const { width, height, data } = req.imageData;
    const settings = req.settings;

    const imgData = new ImageData(new Uint8ClampedArray(data), width, height);

    // 1. Grayscale
    const gray = applyGrayscale(
      imgData,
      settings.source.grayscaleMode,
      settings.source.invert,
      settings.source.contrast,
      settings.source.gamma
    );

    // 2. Thresholding
    const binary = applyThreshold(
      gray,
      width,
      height,
      settings.threshold.mode,
      settings.threshold.value,
      settings.threshold.blockSize,
      settings.threshold.constant,
      settings.threshold.invert
    );

    // 3. Mask Cleanup (Despeckle & hole removal)
    const cleanMask = filterConnectedComponents(
      binary,
      width,
      height,
      settings.cleanup.minComponentArea,
      settings.cleanup.minHoleArea
    );

    // 4. Extraction & Fitting
    let bezierGroups: CubicBezier[][] = [];
    let pathData = '';
    let bezierSegmentsTotal = 0;
    let maxErrorPx = 0;
    let meanErrorPx = 0;

    let contours = findContours(
      cleanMask,
      width,
      height,
      settings.contours.minContourArea,
      settings.cleanup.minHoleArea
    );

    if (settings.contours.outerOnly) {
      contours = contours.filter((c) => !c.isHole);
    }

    const simplifiedGroups: Point[][] = [];
    let rawPointsTotal = 0;
    let retainedPointsTotal = 0;

    if (settings.fitting.mode === 'centerline') {
      // Centerline Skeleton Extraction Engine
      const skeleton = zhangSuenThinning(cleanMask, width, height);
      const rawChains = extractSkeletonChains(skeleton, width, height, settings.fitting.pruneStubs);

      // Apply Post-Simplification Pipeline on Centerline Chains
      const processedChains = rawChains.map((chain) => {
        rawPointsTotal += chain.points.length;

        // 1. RDP Simplification
        let pts = chain.points;
        if (settings.sampling.rdpEpsilon > 0) {
          pts = simplifyDouglasPeucker(pts, settings.sampling.rdpEpsilon);
        }

        // 2. Moving Average Smoothing Filter
        if (settings.sampling.smoothingPasses > 0) {
          pts = smoothPoints(pts, settings.sampling.smoothingPasses, chain.isClosed);
        }

        // 3. Uniform Arc-Length Resampling
        if (settings.sampling.resampleSpacing > 0) {
          pts = resampleArcLength(pts, settings.sampling.resampleSpacing);
        }

        simplifiedGroups.push(pts);
        retainedPointsTotal += pts.length;

        return { points: pts, isClosed: chain.isClosed };
      });

      const clRes = fitCenterlineChains(
        processedChains,
        {
          maxError: settings.fitting.maxError,
          maxIterations: settings.fitting.maxIterations,
          maxDepth: settings.fitting.maxDepth,
        },
        settings.export.precision,
        settings.export.relativeCommands
      );

      pathData = clRes.pathData;
      bezierGroups = clRes.bezierGroups;
      bezierSegmentsTotal = clRes.bezierSegmentsTotal;
    } else {
      // Outlined Boundary Contour Modes
      for (const node of contours) {
        const rawPts = node.points;
        rawPointsTotal += rawPts.length;

        let simp: Point[] = [];
        if (settings.sampling.mode === 'douglasPeucker') {
          const perimeter = node.perimeter;
          const epsilon =
            settings.sampling.simplifyRatio > 0
              ? perimeter * settings.sampling.simplifyRatio
              : settings.sampling.simplifyPixels;
          simp = simplifyDouglasPeucker(rawPts, epsilon);
        } else if (settings.sampling.mode === 'arcLength') {
          simp = resampleArcLength(rawPts, settings.sampling.sampleSpacing);
        } else {
          simp = [...rawPts];
        }

        // Apply RDP & Smoothing if configured
        if (settings.sampling.rdpEpsilon > 0) {
          simp = simplifyDouglasPeucker(simp, settings.sampling.rdpEpsilon);
        }
        if (settings.sampling.smoothingPasses > 0) {
          simp = smoothPoints(simp, settings.sampling.smoothingPasses, true);
        }

        simplifiedGroups.push(simp);
        retainedPointsTotal += simp.length;
      }

      if (settings.fitting.mode === 'potrace') {
        const potraceRes = tracePotrace(imgData, {
          turdsize: settings.cleanup.minComponentArea,
          alphamax: 1.0,
        });
        pathData = potraceRes.paths.join(' ');
        bezierGroups = potraceRes.curves;
        for (const group of bezierGroups) bezierSegmentsTotal += group.length;
      } else if (settings.fitting.mode === 'polygon') {
        const paths: string[] = [];
        for (const group of simplifiedGroups) {
          paths.push(pointsToPolygonPath(group, true));
        }
        pathData = paths.join(' ');
      } else if (settings.fitting.mode === 'catmullRom') {
        for (const group of simplifiedGroups) {
          const cubics = catmullRomClosedToCubics(group, {
            tension: settings.fitting.tension,
            type: 'centripetal',
          });
          bezierGroups.push(cubics);
          bezierSegmentsTotal += cubics.length;
        }
        pathData = serializeCubicBeziersToPath(bezierGroups, {
          precision: settings.export.precision,
          relativeCommands: settings.export.relativeCommands,
          closePaths: true,
        });
      } else {
        // Schneider Error-Bounded Cubic Fit
        const allSamplePoints: Point[] = [];
        const allFittedCurves: CubicBezier[] = [];

        for (let i = 0; i < contours.length; i++) {
          const rawPts = contours[i].points;
          const simpPts = simplifiedGroups[i];
          const cubics = fitCurve(
            simpPts,
            {
              maxError: settings.fitting.maxError,
              maxIterations: settings.fitting.maxIterations,
              maxDepth: settings.fitting.maxDepth,
              seamStrategy: settings.fitting.seamStrategy,
            },
            true
          );

          bezierGroups.push(cubics);
          bezierSegmentsTotal += cubics.length;

          allSamplePoints.push(...rawPts);
          allFittedCurves.push(...cubics);
        }

        pathData = serializeCubicBeziersToPath(bezierGroups, {
          precision: settings.export.precision,
          relativeCommands: settings.export.relativeCommands,
          closePaths: true,
        });

        const errRes = computeOverallError(allSamplePoints, allFittedCurves);
        maxErrorPx = errRes.maxErrorPx;
        meanErrorPx = errRes.meanErrorPx;
      }
    }

    // 5. SVG Document & Stats
    const isCenterline = settings.fitting.mode === 'centerline';
    const svgString = generateSvgDocument({
      width,
      height,
      pathData,
      fillColor: settings.export.fillColor,
      fillRule: settings.contours.fillRule,
      transparentBackground: settings.export.transparentBackground,
      prettyPrint: settings.export.prettyPrint,
      isStrokeMode: isCenterline,
      strokeWidth: settings.fitting.strokeWidth,
      strokeCap: settings.fitting.strokeCap,
      strokeJoin: settings.fitting.strokeJoin,
    });

    const holesCount = contours.filter((c) => c.isHole).length;
    const componentsCount = contours.length - holesCount;

    const stats = computePipelineStats(
      componentsCount,
      contours.length,
      holesCount,
      rawPointsTotal,
      retainedPointsTotal,
      bezierSegmentsTotal,
      svgString,
      width,
      height,
      maxErrorPx,
      meanErrorPx
    );

    const maskBuffer = cleanMask.buffer.slice(0) as ArrayBuffer;

    const resp: WorkerResponse = {
      id: req.id,
      status: 'success',
      result: {
        width,
        height,
        maskData: maskBuffer,
        contours,
        simplifiedPoints: simplifiedGroups,
        bezierGroups,
        svgString,
        pathData,
        stats,
      },
    };

    // @ts-expect-error postMessage transfer typing
    self.postMessage(resp, [maskBuffer]);
  } catch (err) {
    const resp: WorkerResponse = {
      id: req.id,
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(resp);
  }
};
