import { Point, sub, add, normalize, distance } from '../../geometry/point';

export function estimateLeftTangent(points: Point[]): Point {
  if (points.length < 2) return { x: 1, y: 0 };
  const d = sub(points[1], points[0]);
  const norm = normalize(d);
  if (norm.x === 0 && norm.y === 0) return { x: 1, y: 0 };
  return norm;
}

export function estimateRightTangent(points: Point[]): Point {
  if (points.length < 2) return { x: -1, y: 0 };
  const d = sub(points[points.length - 2], points[points.length - 1]);
  const norm = normalize(d);
  if (norm.x === 0 && norm.y === 0) return { x: -1, y: 0 };
  return norm;
}

export function estimateCenterTangent(points: Point[], index: number): Point {
  if (index <= 0 || index >= points.length - 1) {
    return estimateLeftTangent(points);
  }
  const v1 = sub(points[index], points[index - 1]);
  const v2 = sub(points[index + 1], points[index]);
  const d1 = distance(points[index], points[index - 1]);
  const d2 = distance(points[index + 1], points[index]);

  const tan1 = d1 > 0 ? normalize(v1) : { x: 0, y: 0 };
  const tan2 = d2 > 0 ? normalize(v2) : { x: 0, y: 0 };

  const combined = normalize(add(tan1, tan2));
  if (combined.x === 0 && combined.y === 0) {
    return normalize(v1);
  }
  return combined;
}
