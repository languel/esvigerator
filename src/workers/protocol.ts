import { Point, CubicBezier } from '../geometry/point';
import { ContourNode } from '../contours/findContours';
import { PipelineStats } from '../svg/stats';

export interface TraceSettings {
  source: {
    grayscaleMode: 'luminance' | 'average' | 'red' | 'green' | 'blue' | 'alpha';
    invert: boolean;
    maxDimension: number;
    cropEmpty: boolean;
    cropPadding: number;
    contrast: number;
    gamma: number;
  };
  threshold: {
    mode: 'global' | 'otsu' | 'adaptiveMean' | 'adaptiveGaussian';
    value: number;
    blockSize: number;
    constant: number;
    invert: boolean;
  };
  cleanup: {
    blurRadius: number;
    medianRadius: number;
    minComponentArea: number;
    minHoleArea: number;
    erode: number;
    dilate: number;
  };
  contours: {
    preserveHoles: boolean;
    outerOnly: boolean;
    minContourArea: number;
    fillRule: 'evenodd' | 'nonzero';
  };
  sampling: {
    mode: 'raw' | 'arcLength' | 'douglasPeucker';
    simplifyRatio: number; // e.g. 0.0007
    simplifyPixels: number; // e.g. 1.0
    sampleSpacing: number; // e.g. 5.0
    preserveCorners: boolean;
    cornerAngleDegrees: number;
    simplificationMethod: 'douglasPeucker' | 'visvalingamWhyatt' | 'curvatureAdaptive';
    rdpEpsilon: number; // e.g. 1.2 px
    visvalingamAreaThreshold: number; // e.g. 4.0 px²
    smoothingPasses: number; // e.g. 2 passes
    resampleSpacing: number; // e.g. 4.0 px
  };
  fitting: {
    mode: 'polygon' | 'catmullRom' | 'cubicFit' | 'potrace' | 'centerline';
    maxError: number; // e.g. 1.5 px
    tension: number; // Catmull-Rom tension
    maxIterations: number;
    maxDepth: number;
    seamStrategy: 'lowestCurvature' | 'firstPoint';
    strokeWidth: number; // e.g. 2.5 px
    strokeCap: 'round' | 'butt' | 'square';
    strokeJoin: 'round' | 'miter' | 'bevel';
    pruneStubs: number; // e.g. 5 px
    mergeDistance: number; // e.g. 8.0 px
  };
  export: {
    precision: number | null; // 0, 1, 2, 3 or null
    relativeCommands: boolean;
    prettyPrint: boolean;
    transparentBackground: boolean;
    fillColor: string;
  };
}

export interface WorkerRequest {
  id: string;
  action: 'trace';
  imageData: {
    width: number;
    height: number;
    data: ArrayBuffer;
  };
  settings: TraceSettings;
}

export interface WorkerResponse {
  id: string;
  status: 'success' | 'error';
  error?: string;
  result?: {
    width: number;
    height: number;
    maskData: ArrayBuffer;
    contours: ContourNode[];
    simplifiedPoints: Point[][];
    bezierGroups: CubicBezier[][];
    svgString: string;
    pathData: string;
    stats: PipelineStats;
  };
}
