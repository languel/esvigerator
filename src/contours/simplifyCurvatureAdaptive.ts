import { Point, sub, normalize, dot } from '../geometry/point';
import { simplifyDouglasPeucker } from './simplifyDouglasPeucker';

/**
 * Computes the interior turn angle in degrees at vertex P_i.
 * Straight line = 0 deg. Sharp 90 deg turn = 90 deg. U-turn = 180 deg.
 */
export function computeTurnAngleDegrees(pPrev: Point, pCurr: Point, pNext: Point): number {
  const v1 = normalize(sub(pCurr, pPrev));
  const v2 = normalize(sub(pNext, pCurr));

  if ((v1.x === 0 && v1.y === 0) || (v2.x === 0 && v2.y === 0)) return 0;

  const cosTheta = Math.max(-1, Math.min(1, dot(v1, v2)));
  const angleRad = Math.acos(cosTheta);
  return (angleRad * 180) / Math.PI;
}

/**
 * Curvature-Adaptive Douglas-Peucker Simplification
 * Detects sharp corners, dendrite terminals, and high-curvature vertices
 * and forces them to be mandatory control points, preventing tip mangling.
 */
export function simplifyCurvatureAdaptive(
  points: Point[],
  baseEpsilon: number,
  cornerAngleThresholdDegrees = 25,
  isClosed = false
): Point[] {
  if (points.length <= 3 || baseEpsilon <= 0) return [...points];

  const n = points.length;

  // 1. Identify mandatory corner vertices
  const isCorner = new Uint8Array(n);

  if (!isClosed) {
    isCorner[0] = 1;
    isCorner[n - 1] = 1;
  }

  for (let i = 1; i < n - 1; i++) {
    const turnAngle = computeTurnAngleDegrees(points[i - 1], points[i], points[i + 1]);
    if (turnAngle >= cornerAngleThresholdDegrees) {
      isCorner[i] = 1;
    }
  }

  // 2. Collect mandatory corner indices
  const cornerIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (isCorner[i]) cornerIndices.push(i);
  }

  if (cornerIndices.length < 2) {
    return simplifyDouglasPeucker(points, baseEpsilon);
  }

  // 3. Apply RDP on sub-chains between mandatory corners
  const result: Point[] = [];

  for (let c = 0; c < cornerIndices.length - 1; c++) {
    const startIdx = cornerIndices[c];
    const endIdx = cornerIndices[c + 1];

    const subChain = points.slice(startIdx, endIdx + 1);
    if (subChain.length <= 2) {
      if (c === 0) result.push(...subChain);
      else result.push(...subChain.slice(1));
      continue;
    }

    // Measure max curvature in subchain to scale local epsilon
    let maxTurn = 0;
    for (let k = 1; k < subChain.length - 1; k++) {
      const turn = computeTurnAngleDegrees(subChain[k - 1], subChain[k], subChain[k + 1]);
      if (turn > maxTurn) maxTurn = turn;
    }

    // High curvature sub-chain gets smaller epsilon (more detail retained)
    // Low curvature sub-chain gets larger epsilon (aggressive simplification)
    const curvatureFactor = 1 / (1 + maxTurn / 45);
    const localEpsilon = baseEpsilon * Math.max(0.2, curvatureFactor);

    const simplifiedSub = simplifyDouglasPeucker(subChain, localEpsilon);

    if (c === 0) {
      result.push(...simplifiedSub);
    } else {
      result.push(...simplifiedSub.slice(1));
    }
  }

  return result.length >= 2 ? result : [...points];
}
