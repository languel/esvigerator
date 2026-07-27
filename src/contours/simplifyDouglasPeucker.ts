import { Point, distance } from '../geometry/point';

function perpendicularDistance(p: Point, lineA: Point, lineB: Point): number {
  const dx = lineB.x - lineA.x;
  const dy = lineB.y - lineA.y;

  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(p, lineA);

  const num = Math.abs(dy * p.x - dx * p.y + lineB.x * lineA.y - lineB.y * lineA.x);
  return num / Math.sqrt(lenSq);
}

export function simplifyDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2 || epsilon <= 0) return [...points];

  let maxDist = 0;
  let index = 0;
  const last = points.length - 1;

  for (let i = 1; i < last; i++) {
    const d = perpendicularDistance(points[i], points[0], points[last]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const rec1 = simplifyDouglasPeucker(points.slice(0, index + 1), epsilon);
    const rec2 = simplifyDouglasPeucker(points.slice(index), epsilon);
    return [...rec1.slice(0, rec1.length - 1), ...rec2];
  } else {
    return [points[0], points[last]];
  }
}
