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
  };
  fitting: {
    mode: 'polygon' | 'catmullRom' | 'cubicFit' | 'potrace';
    maxError: number; // e.g. 1.5 px
    tension: number; // Catmull-Rom tension
    maxIterations: number;
    maxDepth: number;
    seamStrategy: 'lowestCurvature' | 'firstPoint';
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
    maskData: ArrayBuffer; // Binary mask bytes for display
    contours: ContourNode[];
    simplifiedPoints: Point[][];
    bezierGroups: CubicBezier[][];
    svgString: string;
    pathData: string;
    stats: PipelineStats;
  };
}
