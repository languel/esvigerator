import { Point, turningAngle } from '../geometry/point';

export function detectCorners(points: Point[], angleDegrees: number): boolean[] {
  const n = points.length;
  if (n < 3) return points.map(() => false);

  const thresholdRad = (angleDegrees * Math.PI) / 180;
  const isCorner: boolean[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const turn = turningAngle(prev, curr, next);
    isCorner.push(turn >= thresholdRad);
  }

  return isCorner;
}
