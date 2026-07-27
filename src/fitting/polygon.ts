import { Point } from '../geometry/point';

export function pointsToPolygonPath(points: Point[], isClosed = true): string {
  if (points.length === 0) return '';
  const commands = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let i = 1; i < points.length; i++) {
    commands.push(`L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`);
  }
  if (isClosed) {
    commands.push('Z');
  }
  return commands.join(' ');
}
