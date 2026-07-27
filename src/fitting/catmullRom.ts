import { Point, CubicBezier, distance, add, sub, mul } from '../geometry/point';

export type CatmullRomType = 'centripetal' | 'uniform' | 'chordal';

export interface CatmullRomOptions {
  tension?: number; // default 1
  type?: CatmullRomType; // default 'centripetal'
}

export function catmullRomClosedToCubics(
  points: Point[],
  options: CatmullRomOptions = {}
): CubicBezier[] {
  const n = points.length;
  if (n < 3) return [];

  const tension = options.tension ?? 1;
  const type = options.type ?? 'centripetal';
  const alpha = type === 'uniform' ? 0 : type === 'chordal' ? 1 : 0.5;

  const curves: CubicBezier[] = [];

  function getT(t: number, p0: Point, p1: Point): number {
    const d = distance(p0, p1);
    return t + Math.pow(Math.max(d, 1e-6), alpha);
  }

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    if (alpha === 0) {
      // Standard uniform Catmull-Rom
      const c1 = add(p1, mul(sub(p2, p0), tension / 6));
      const c2 = sub(p2, mul(sub(p3, p1), tension / 6));
      curves.push({ p0: p1, c1, c2, p1: p2 });
    } else {
      // Non-uniform (centripetal/chordal)
      const t0 = 0;
      const t1 = getT(t0, p0, p1);
      const t2 = getT(t1, p1, p2);
      const t3 = getT(t2, p2, p3);

      const dt10 = t1 - t0;
      const dt21 = t2 - t1;
      const dt32 = t3 - t2;
      const dt20 = t2 - t0;
      const dt31 = t3 - t1;

      // Tangents
      const d1x = (p1.x - p0.x) / dt10 - (p2.x - p0.x) / dt20 + (p2.x - p1.x) / dt21;
      const d1y = (p1.y - p0.y) / dt10 - (p2.y - p0.y) / dt20 + (p2.y - p1.y) / dt21;

      const d2x = (p2.x - p1.x) / dt21 - (p3.x - p1.x) / dt31 + (p3.x - p2.x) / dt32;
      const d2y = (p2.y - p1.y) / dt21 - (p3.y - p1.y) / dt31 + (p3.y - p2.y) / dt32;

      const c1 = {
        x: p1.x + (d1x * dt21 * tension) / 3,
        y: p1.y + (d1y * dt21 * tension) / 3,
      };

      const c2 = {
        x: p2.x - (d2x * dt21 * tension) / 3,
        y: p2.y - (d2y * dt21 * tension) / 3,
      };

      curves.push({ p0: p1, c1, c2, p1: p2 });
    }
  }

  return curves;
}
