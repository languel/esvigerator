import { Point, distance, lerp } from '../geometry/point';

export function resampleArcLength(points: Point[], spacing: number): Point[] {
  if (points.length < 2 || spacing <= 0) return [...points];

  const result: Point[] = [points[0]];
  let accumDist = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segDist = distance(prev, curr);

    if (segDist === 0) continue;

    let distLeftInSeg = segDist;
    let currentPointOnSeg = prev;

    while (accumDist + distLeftInSeg >= spacing) {
      const needed = spacing - accumDist;
      const t = needed / distLeftInSeg;
      const nextPt = lerp(currentPointOnSeg, curr, t);

      result.push(nextPt);
      currentPointOnSeg = nextPt;
      distLeftInSeg -= needed;
      accumDist = 0;
    }

    accumDist += distLeftInSeg;
  }

  const lastOrig = points[points.length - 1];
  if (distance(result[result.length - 1], lastOrig) > spacing * 0.25) {
    result.push(lastOrig);
  }

  return result;
}
