import { Point, CubicBezier, sub, distance, negate, turningAngle } from '../../geometry/point';
import { chordLengthParameterize } from './parameterize';
import { generateBezier } from './generateBezier';
import { reparameterize } from './reparameterize';
import { computeMaxError } from './computeError';
import { estimateLeftTangent, estimateRightTangent, estimateCenterTangent } from './tangents';

export interface FitOptions {
  maxError: number; // in pixels
  maxIterations?: number;
  maxDepth?: number;
  preserveCorners?: boolean;
  cornerAngleDegrees?: number;
  seamStrategy?: 'lowestCurvature' | 'firstPoint';
}

function makeTwoPointBezier(
  p0: Point,
  p1: Point,
  leftTangent: Point,
  rightTangent: Point
): CubicBezier {
  const dist = distance(p0, p1) / 3;
  return {
    p0,
    c1: { x: p0.x + leftTangent.x * dist, y: p0.y + leftTangent.y * dist },
    c2: { x: p1.x + rightTangent.x * dist, y: p1.y + rightTangent.y * dist },
    p1,
  };
}

function fitCubicRecursive(
  points: Point[],
  leftTangent: Point,
  rightTangent: Point,
  maxErrorPx: number,
  maxIterations: number,
  maxDepth: number,
  depth: number
): CubicBezier[] {
  if (points.length <= 2) {
    return [makeTwoPointBezier(points[0], points[points.length - 1], leftTangent, rightTangent)];
  }

  const u = chordLengthParameterize(points);
  let curve = generateBezier(points, u, leftTangent, rightTangent);
  let { maxError, splitIndex } = computeMaxError(points, curve, u);

  const errorSq = maxErrorPx * maxErrorPx;

  if (maxError <= errorSq) {
    return [curve];
  }

  // Attempt Newton-Raphson reparameterization if error is within 4x tolerance
  if (maxError <= errorSq * 4 && maxIterations > 0) {
    let parameters = u;
    for (let i = 0; i < maxIterations; i++) {
      parameters = reparameterize(points, parameters, curve);
      curve = generateBezier(points, parameters, leftTangent, rightTangent);
      const result = computeMaxError(points, curve, parameters);
      maxError = result.maxError;
      splitIndex = result.splitIndex;
      if (maxError <= errorSq) {
        return [curve];
      }
    }
  }

  if (depth >= maxDepth || splitIndex <= 0 || splitIndex >= points.length - 1) {
    const mid = Math.floor(points.length / 2);
    const leftTan = estimateCenterTangent(points, mid);
    const left = fitCubicRecursive(
      points.slice(0, mid + 1),
      leftTangent,
      leftTan,
      maxErrorPx,
      maxIterations,
      maxDepth,
      depth + 1
    );
    const right = fitCubicRecursive(
      points.slice(mid),
      negate(leftTan),
      rightTangent,
      maxErrorPx,
      maxIterations,
      maxDepth,
      depth + 1
    );
    return [...left, ...right];
  }

  const centerTangent = estimateCenterTangent(points, splitIndex);

  const left = fitCubicRecursive(
    points.slice(0, splitIndex + 1),
    leftTangent,
    centerTangent,
    maxErrorPx,
    maxIterations,
    maxDepth,
    depth + 1
  );

  const right = fitCubicRecursive(
    points.slice(splitIndex),
    negate(centerTangent),
    rightTangent,
    maxErrorPx,
    maxIterations,
    maxDepth,
    depth + 1
  );

  return [...left, ...right];
}

export function findLowestCurvatureSeam(points: Point[]): number {
  if (points.length < 4) return 0;
  let minAngle = Infinity;
  let bestIndex = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const angle = turningAngle(prev, curr, next);
    if (angle < minAngle) {
      minAngle = angle;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function fitCurve(
  points: Point[],
  options: FitOptions,
  isClosed = false
): CubicBezier[] {
  if (points.length < 2) return [];

  const maxErrorPx = options.maxError ?? 1.5;
  const maxIterations = options.maxIterations ?? 4;
  const maxDepth = options.maxDepth ?? 32;

  let workPoints = [...points];

  if (isClosed && workPoints.length >= 3) {
    if (options.seamStrategy !== 'firstPoint') {
      const seamIndex = findLowestCurvatureSeam(workPoints);
      if (seamIndex > 0) {
        workPoints = [
          ...workPoints.slice(seamIndex),
          ...workPoints.slice(0, seamIndex),
        ];
      }
    }
    // Make sure closed points loop back explicitly
    const first = workPoints[0];
    const last = workPoints[workPoints.length - 1];
    if (distance(first, last) > 1e-4) {
      workPoints.push({ ...first });
    }
  }

  const leftTangent = estimateLeftTangent(workPoints);
  const rightTangent = estimateRightTangent(workPoints);

  return fitCubicRecursive(
    workPoints,
    leftTangent,
    rightTangent,
    maxErrorPx,
    maxIterations,
    maxDepth,
    0
  );
}
