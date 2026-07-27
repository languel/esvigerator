import { Point, sub, dot, lengthSq } from '../../geometry/point';
import { CubicBezier } from '../../geometry/point';
import { evaluateBezier, evaluateBezierPrime, evaluateBezierPrimePrime } from './evaluateBezier';

export function NewtonRaphsonRootFind(curve: CubicBezier, p: Point, u: number): number {
  const qu = evaluateBezier(curve, u);
  const q1u = evaluateBezierPrime(curve, u);
  const q2u = evaluateBezierPrimePrime(curve, u);

  const diff = sub(qu, p);
  const numerator = dot(diff, q1u);
  const denominator = lengthSq(q1u) + dot(diff, q2u);

  if (Math.abs(denominator) < 1e-12) return u;

  return u - numerator / denominator;
}

export function reparameterize(points: Point[], u: number[], curve: CubicBezier): number[] {
  return points.map((p, i) => NewtonRaphsonRootFind(curve, p, u[i]));
}
