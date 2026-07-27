import { Point, distance } from '../../geometry/point';

export function chordLengthParameterize(points: Point[]): number[] {
  const u: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    u.push(u[i - 1] + distance(points[i], points[i - 1]));
  }
  const totalLength = u[u.length - 1];
  if (totalLength === 0) {
    return points.map((_, i) => (points.length > 1 ? i / (points.length - 1) : 0));
  }
  return u.map((val) => val / totalLength);
}
