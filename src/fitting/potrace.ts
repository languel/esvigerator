import { Point, CubicBezier } from '../geometry/point';

export interface PotraceOptions {
  turdsize?: number; // despeckle threshold
  alphamax?: number; // corner threshold (0 to 1.333)
  optcurve?: boolean; // curve optimization
  opttolerance?: number; // curve optimization tolerance
  turnpolicy?: 'black' | 'white' | 'left' | 'right' | 'minority' | 'majority';
}

// Lightweight browser-native Potrace tracer implementation
export function tracePotrace(
  imageData: ImageData,
  options: PotraceOptions = {}
): { paths: string[]; curves: CubicBezier[][] } {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const turdsize = options.turdsize ?? 2;
  const alphamax = options.alphamax ?? 1.0;

  // 1. Create binary bitmap grid (1 = foreground/black line)
  const bm = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    bm[i] = lum < 128 ? 1 : 0;
  }

  // Simple grid boundary contour extractor for Potrace baseline mode
  const visited = new Uint8Array(width * height);
  const rawContours: Point[][] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (bm[idx] === 1 && !visited[idx]) {
        // Trace boundary loop
        const points: Point[] = [];
        let cx = x;
        let cy = y;
        let dir = 0; // 0: right, 1: down, 2: left, 3: up
        const startX = cx;
        const startY = cy;

        let steps = 0;
        const maxSteps = width * height;

        while (steps < maxSteps) {
          visited[cy * width + cx] = 1;
          points.push({ x: cx, y: cy });

          // Turn right, straight, left preference
          const dx = [1, 0, -1, 0];
          const dy = [0, 1, 0, -1];
          let found = false;

          for (let d = 0; d < 4; d++) {
            const ndir = (dir + 3 + d) % 4;
            const nx = cx + dx[ndir];
            const ny = cy + dy[ndir];
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && bm[ny * width + nx] === 1) {
              cx = nx;
              cy = ny;
              dir = ndir;
              found = true;
              break;
            }
          }

          if (!found || (cx === startX && cy === startY)) break;
          steps++;
        }

        if (points.length >= turdsize) {
          rawContours.push(points);
        }
      }
    }
  }

  // Smooth raw contours into Potrace-style cubic bezier curves
  const resultPaths: string[] = [];
  const resultCurves: CubicBezier[][] = [];

  for (const points of rawContours) {
    const n = points.length;
    if (n < 3) continue;

    // Simplify points
    const step = Math.max(1, Math.floor(n / 30));
    const sampled: Point[] = [];
    for (let i = 0; i < n; i += step) {
      sampled.push(points[i]);
    }

    const sn = sampled.length;
    const pathCurves: CubicBezier[] = [];
    const cmds: string[] = [`M ${sampled[0].x} ${sampled[0].y}`];

    for (let i = 0; i < sn; i++) {
      const p0 = sampled[(i - 1 + sn) % sn];
      const p1 = sampled[i];
      const p2 = sampled[(i + 1) % sn];
      const p3 = sampled[(i + 2) % sn];

      const tension = 0.5 * alphamax;
      const c1 = {
        x: p1.x + (tension * (p2.x - p0.x)) / 3,
        y: p1.y + (tension * (p2.y - p0.y)) / 3,
      };
      const c2 = {
        x: p2.x - (tension * (p3.x - p1.x)) / 3,
        y: p2.y - (tension * (p3.y - p1.y)) / 3,
      };

      pathCurves.push({ p0: p1, c1, c2, p1: p2 });
      cmds.push(
        `C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
      );
    }

    cmds.push('Z');
    resultPaths.push(cmds.join(' '));
    resultCurves.push(pathCurves);
  }

  return { paths: resultPaths, curves: resultCurves };
}
