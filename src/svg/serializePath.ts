import { Point, CubicBezier, quantizePoint } from '../geometry/point';

export interface SerializePathOptions {
  precision?: number | null; // e.g. 0.1 (1 decimal), null for full
  relativeCommands?: boolean;
  closePaths?: boolean;
}

export function formatNum(val: number, precision: number | null): string {
  if (precision === null) return val.toString();
  const factor = Math.pow(10, precision);
  const rounded = Math.round(val * factor) / factor;
  return rounded.toString();
}

export function serializeCubicBeziersToPath(
  bezierGroups: CubicBezier[][],
  options: SerializePathOptions = {}
): string {
  const precision = options.precision ?? 1;
  const isRelative = options.relativeCommands ?? false;
  const isClose = options.closePaths ?? true;

  const pathCommands: string[] = [];

  for (const group of bezierGroups) {
    if (group.length === 0) continue;

    const startPt = quantizePoint(group[0].p0, precision);
    pathCommands.push(`M ${formatNum(startPt.x, precision)} ${formatNum(startPt.y, precision)}`);

    let currentPt = startPt;

    for (const seg of group) {
      const c1 = quantizePoint(seg.c1, precision);
      const c2 = quantizePoint(seg.c2, precision);
      const p1 = quantizePoint(seg.p1, precision);

      if (isRelative) {
        const dc1x = c1.x - currentPt.x;
        const dc1y = c1.y - currentPt.y;
        const dc2x = c2.x - currentPt.x;
        const dc2y = c2.y - currentPt.y;
        const dp1x = p1.x - currentPt.x;
        const dp1y = p1.y - currentPt.y;

        pathCommands.push(
          `c ${formatNum(dc1x, precision)} ${formatNum(dc1y, precision)} ${formatNum(dc2x, precision)} ${formatNum(dc2y, precision)} ${formatNum(dp1x, precision)} ${formatNum(dp1y, precision)}`
        );
      } else {
        pathCommands.push(
          `C ${formatNum(c1.x, precision)} ${formatNum(c1.y, precision)} ${formatNum(c2.x, precision)} ${formatNum(c2.y, precision)} ${formatNum(p1.x, precision)} ${formatNum(p1.y, precision)}`
        );
      }

      currentPt = p1;
    }

    if (isClose) {
      pathCommands.push('Z');
    }
  }

  return pathCommands.join(' ');
}
