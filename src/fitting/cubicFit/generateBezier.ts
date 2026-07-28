import { Point, CubicBezier, sub, add, mul, dot, distance } from '../../geometry/point';

export function generateBezier(
  points: Point[],
  u: number[],
  leftTangent: Point,
  rightTangent: Point
): CubicBezier {
  const p0 = points[0];
  const p3 = points[points.length - 1];

  const segLength = distance(p0, p3);

  if (points.length === 2 || segLength < 1e-6) {
    const dist = segLength / 3;
    const c1 = add(p0, mul(leftTangent, dist));
    const c2 = add(p3, mul(rightTangent, dist));
    return { p0, c1, c2, p1: p3 };
  }

  // Build C and X matrices for least squares fitting
  let c11 = 0;
  let c12 = 0;
  let c22 = 0;
  let x1 = 0;
  let x2 = 0;

  const n = points.length;

  for (let i = 0; i < n; i++) {
    const ui = u[i];
    const u1 = 1 - ui;
    const b0 = u1 * u1 * u1;
    const b1 = 3 * ui * u1 * u1;
    const b2 = 3 * ui * ui * u1;
    const b3 = ui * ui * ui;

    const a1 = mul(leftTangent, b1);
    const a2 = mul(rightTangent, b2);

    c11 += dot(a1, a1);
    c12 += dot(a1, a2);
    c22 += dot(a2, a2);

    const term0 = mul(p0, b0 + b1);
    const term3 = mul(p3, b2 + b3);
    const target = sub(points[i], add(term0, term3));

    x1 += dot(a1, target);
    x2 += dot(a2, target);
  }

  const detC0C1 = c11 * c22 - c12 * c12;
  const detC0X = c11 * x2 - c12 * x1;
  const detXC1 = x1 * c22 - c12 * x2;

  let alphaL = detC0C1 === 0 ? 0 : detXC1 / detC0C1;
  let alphaR = detC0C1 === 0 ? 0 : detC0X / detC0C1;

  // Maximum allowed control handle length (Schneider heuristics)
  const maxAlpha = segLength * 1.2;
  const minAlpha = 1e-4;

  let c1: Point;
  let c2: Point;

  if (
    isNaN(alphaL) ||
    isNaN(alphaR) ||
    alphaL < minAlpha ||
    alphaR < minAlpha ||
    alphaL > maxAlpha ||
    alphaR > maxAlpha
  ) {
    const dist = segLength / 3;
    c1 = add(p0, mul(leftTangent, dist));
    c2 = add(p3, mul(rightTangent, dist));
  } else {
    c1 = add(p0, mul(leftTangent, alphaL));
    c2 = add(p3, mul(rightTangent, alphaR));
  }

  return { p0, c1, c2, p1: p3 };
}
