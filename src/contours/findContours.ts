import { Point, Bounds, computeBounds } from '../geometry/point';

export interface ContourNode {
  id: number;
  points: Point[];
  isHole: boolean;
  parentId: number | null;
  childrenIds: number[];
  depth: number;
  area: number;
  perimeter: number;
  bounds: Bounds;
}

export function computeContourArea(points: Point[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(area) / 2;
}

export function computeContourPerimeter(points: Point[]): number {
  let len = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

export function findContours(
  binaryMask: Uint8Array,
  width: number,
  height: number,
  minContourArea = 0,
  minHoleArea = 0
): ContourNode[] {
  const visitedOuter = new Uint8Array(width * height);
  const visitedHole = new Uint8Array(width * height);
  const contours: ContourNode[] = [];

  const dx = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy = [0, 1, 1, 1, 0, -1, -1, -1];

  function getPixel(x: number, y: number): number {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return binaryMask[y * width + x] > 0 ? 1 : 0;
  }

  let nextId = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pix = getPixel(x, y);

      if (pix === 0) continue;

      const isOuter =
        getPixel(x - 1, y) === 0 &&
        visitedOuter[idx] === 0 &&
        visitedHole[idx] === 0;

      const isHole =
        getPixel(x + 1, y) === 0 &&
        visitedHole[idx] === 0 &&
        visitedOuter[idx] === 0;

      if (!isOuter && !isHole) continue;

      const tracingOuter = isOuter;
      const visitedArray = tracingOuter ? visitedOuter : visitedHole;

      const points: Point[] = [];
      let cx = x;
      let cy = y;
      let dir = tracingOuter ? 0 : 4;
      const startX = cx;
      const startY = cy;

      let steps = 0;
      const maxSteps = width * height;

      while (steps < maxSteps) {
        visitedArray[cy * width + cx] = 1;
        points.push({ x: cx, y: cy });

        let found = false;
        const startDir = (dir + (tracingOuter ? 6 : 2)) % 8;

        for (let i = 0; i < 8; i++) {
          const checkDir = (startDir + (tracingOuter ? i : 8 - i)) % 8;
          const nx = cx + dx[checkDir];
          const ny = cy + dy[checkDir];

          if (getPixel(nx, ny) === 1) {
            cx = nx;
            cy = ny;
            dir = checkDir;
            found = true;
            break;
          }
        }

        if (!found || (cx === startX && cy === startY)) break;
        steps++;
      }

      if (points.length < 3) continue;

      const area = computeContourArea(points);
      const perimeter = computeContourPerimeter(points);
      const bounds = computeBounds(points);

      const isHoleBorder = !tracingOuter;
      if (isHoleBorder && minHoleArea > 0 && area < minHoleArea) continue;
      if (!isHoleBorder && minContourArea > 0 && area < minContourArea) continue;

      let parentId: number | null = null;
      let depth = 0;

      for (let pIdx = contours.length - 1; pIdx >= 0; pIdx--) {
        const candidate = contours[pIdx];
        if (
          bounds.minX >= candidate.bounds.minX &&
          bounds.maxX <= candidate.bounds.maxX &&
          bounds.minY >= candidate.bounds.minY &&
          bounds.maxY <= candidate.bounds.maxY
        ) {
          parentId = candidate.id;
          depth = candidate.depth + 1;
          candidate.childrenIds.push(nextId);
          break;
        }
      }

      contours.push({
        id: nextId,
        points,
        isHole: isHoleBorder,
        parentId,
        childrenIds: [],
        depth,
        area,
        perimeter,
        bounds,
      });

      nextId++;
    }
  }

  return contours;
}
