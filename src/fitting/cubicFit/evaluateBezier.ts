import { Point, CubicBezier } from '../../geometry/point';

export function evaluateBezier(curve: CubicBezier, t: number): Point {
  const invT = 1 - t;
  const invT2 = invT * invT;
  const invT3 = invT2 * invT;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x:
      invT3 * curve.p0.x +
      3 * invT2 * t * curve.c1.x +
      3 * invT * t2 * curve.c2.x +
      t3 * curve.p1.x,
    y:
      invT3 * curve.p0.y +
      3 * invT2 * t * curve.c1.y +
      3 * invT * t2 * curve.c2.y +
      t3 * curve.p1.y,
  };
}

export function evaluateBezierPrime(curve: CubicBezier, t: number): Point {
  const invT = 1 - t;
  const invT2 = invT * invT;
  const t2 = t * t;

  return {
    x:
      3 * invT2 * (curve.c1.x - curve.p0.x) +
      6 * invT * t * (curve.c2.x - curve.c1.x) +
      3 * t2 * (curve.p1.x - curve.c2.x),
    y:
      3 * invT2 * (curve.c1.y - curve.p0.y) +
      6 * invT * t * (curve.c2.y - curve.c1.y) +
      3 * t2 * (curve.p1.y - curve.c2.y),
  };
}

export function evaluateBezierPrimePrime(curve: CubicBezier, t: number): Point {
  const invT = 1 - t;

  return {
    x:
      6 * invT * (curve.c2.x - 2 * curve.c1.x + curve.p0.x) +
      6 * t * (curve.p1.x - 2 * curve.c2.x + curve.c1.x),
    y:
      6 * invT * (curve.c2.y - 2 * curve.c1.y + curve.p0.y) +
      6 * t * (curve.p1.y - 2 * curve.c2.y + curve.c1.y),
  };
}
