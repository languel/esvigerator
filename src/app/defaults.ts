import { TraceSettings } from '../workers/protocol';

export const DEFAULT_TRACE_SETTINGS: TraceSettings = {
  source: {
    grayscaleMode: 'luminance',
    invert: false,
    maxDimension: 1600,
    cropEmpty: true,
    cropPadding: 12,
    contrast: 0,
    gamma: 1.0,
  },
  threshold: {
    mode: 'global',
    value: 170,
    blockSize: 15,
    constant: 10,
    invert: false,
  },
  cleanup: {
    blurRadius: 0,
    medianRadius: 0,
    minComponentArea: 80,
    minHoleArea: 20,
    erode: 0,
    dilate: 0,
  },
  contours: {
    preserveHoles: true,
    outerOnly: false,
    minContourArea: 0,
    fillRule: 'evenodd',
  },
  sampling: {
    mode: 'douglasPeucker',
    simplifyRatio: 0.0007,
    simplifyPixels: 1.0,
    sampleSpacing: 5.0,
    preserveCorners: true,
    cornerAngleDegrees: 25,
    simplificationMethod: 'curvatureAdaptive',
    rdpEpsilon: 1.2,
    visvalingamAreaThreshold: 4.0,
    smoothingPasses: 2,
    resampleSpacing: 4.0,
  },
  fitting: {
    mode: 'cubicFit',
    maxError: 1.5,
    tension: 1.0,
    maxIterations: 4,
    maxDepth: 32,
    seamStrategy: 'lowestCurvature',
    strokeWidth: 2.5,
    strokeCap: 'round',
    strokeJoin: 'round',
    pruneStubs: 5,
    mergeDistance: 8.0,
  },
  export: {
    precision: 1, // 0.1 decimal places
    relativeCommands: false,
    prettyPrint: true,
    transparentBackground: true,
    fillColor: '#111111',
  },
};

export const PRESETS: Record<string, TraceSettings> = {
  'Clean line art': DEFAULT_TRACE_SETTINGS,

  'Centerline Stroke (Fixed Width)': {
    ...DEFAULT_TRACE_SETTINGS,
    sampling: {
      ...DEFAULT_TRACE_SETTINGS.sampling,
      simplificationMethod: 'curvatureAdaptive',
      cornerAngleDegrees: 20,
      rdpEpsilon: 1.5,
      smoothingPasses: 2,
      resampleSpacing: 4.0,
    },
    fitting: {
      ...DEFAULT_TRACE_SETTINGS.fitting,
      mode: 'centerline',
      strokeWidth: 2.5,
      strokeCap: 'round',
      strokeJoin: 'round',
      pruneStubs: 6,
      mergeDistance: 10.0,
      maxError: 2.0,
    },
  },

  'Literal trace': {
    ...DEFAULT_TRACE_SETTINGS,
    sampling: {
      ...DEFAULT_TRACE_SETTINGS.sampling,
      mode: 'raw',
      rdpEpsilon: 0,
      smoothingPasses: 0,
    },
    fitting: {
      ...DEFAULT_TRACE_SETTINGS.fitting,
      mode: 'polygon',
    },
  },

  'Smooth icon': {
    ...DEFAULT_TRACE_SETTINGS,
    sampling: {
      ...DEFAULT_TRACE_SETTINGS.sampling,
      mode: 'douglasPeucker',
      simplifyRatio: 0.0015,
      smoothingPasses: 4,
    },
    fitting: {
      ...DEFAULT_TRACE_SETTINGS.fitting,
      mode: 'cubicFit',
      maxError: 3.0,
    },
  },

  'Technical diagram': {
    ...DEFAULT_TRACE_SETTINGS,
    threshold: {
      ...DEFAULT_TRACE_SETTINGS.threshold,
      mode: 'otsu',
    },
    fitting: {
      ...DEFAULT_TRACE_SETTINGS.fitting,
      mode: 'cubicFit',
      maxError: 1.0,
    },
  },

  'Aggressive simplification': {
    ...DEFAULT_TRACE_SETTINGS,
    sampling: {
      ...DEFAULT_TRACE_SETTINGS.sampling,
      mode: 'douglasPeucker',
      simplifyRatio: 0.003,
      rdpEpsilon: 2.5,
      smoothingPasses: 4,
    },
    fitting: {
      ...DEFAULT_TRACE_SETTINGS.fitting,
      mode: 'cubicFit',
      maxError: 5.0,
    },
  },

  'Potrace baseline': {
    ...DEFAULT_TRACE_SETTINGS,
    fitting: {
      ...DEFAULT_TRACE_SETTINGS.fitting,
      mode: 'potrace',
    },
  },
};
