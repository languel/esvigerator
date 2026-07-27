import { Point, CubicBezier, distanceSq } from '../../geometry/point';
import { evaluateBezier } from './evaluateBezier';

export interface FitErrorResult {
  maxError: number; // Squared distance
  splitIndex: number;
}

export function computeMaxError(
  points: Point[],
  curve: CubicBezier,
  u: number[]
): FitErrorResult {
  let maxError = 0;
  let splitIndex = Math.floor(points.length / 2);

  for (let i = 1; i < points.length - 1; i++) {
    const P = points[i];
    const Q = evaluateBezier(curve, u[i]);
    const err = distanceSq(P, Q);

    if (err >= maxError) {
      maxError = err;
      splitIndex = i;
    }
  }

  return { maxError, splitIndex };
}

export function computeOverallError(
  points: Point[],
  curves: CubicBezier[]
): { maxErrorPx: number; meanErrorPx: number } {
  if (points.length === 0 || curves.length === 0) {
    return { maxErrorPx: 0, meanErrorPx: 0 };
  }

  let maxDistSq = 0;
  let sumDistSq = 0;

  for (const pt of points) {
    let minPtDistSq = Infinity;
    for (const curve of curves) {
      // Sample 16 points along bezier segment to approximate distance to curve
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        const q = evaluateBezier(curve, t);
        const dSq = distanceSq(pt, q);
        if (dSq < minPtDistSq) minPtDistSq = dSq;
      }
    }
    if (minPtDistSq > maxDistSq) maxDistSq = minPtDistSq;
    sumDistSq += minPtDistSq;
  }

  return {
    maxErrorPx: Math.sqrt(maxDistSq),
    meanErrorPx: Math.sqrt(sumDistSq / points.length),
  };
}
