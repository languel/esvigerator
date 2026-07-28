import { Point } from '../geometry/point';

/**
 * Computes the area of the triangle formed by three points (p1, p2, p3).
 */
export function triangleArea(p1: Point, p2: Point, p3: Point): number {
  return 0.5 * Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
}

/**
 * Visvalingam-Whyatt Simplification Algorithm (Area / Curvature-Based)
 * Progressively eliminates points that form the smallest triangular area.
 * Preserves sharp dendrite tips, tight corners, and structural features
 * while smoothing out flat areas and noise stair-stepping.
 */
export function simplifyVisvalingamWhyatt(
  points: Point[],
  thresholdArea: number,
  isClosed = false
): Point[] {
  if (points.length <= 3 || thresholdArea <= 0) return [...points];

  const n = points.length;
  const pts = points.map((p) => ({ ...p }));

  // Track active neighbors in a doubly-linked list structure
  const prevIdx = new Int32Array(n);
  const nextIdx = new Int32Array(n);
  const areas = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    prevIdx[i] = (i - 1 + n) % n;
    nextIdx[i] = (i + 1) % n;
  }

  // Calculate initial triangular areas
  for (let i = 0; i < n; i++) {
    if (!isClosed && (i === 0 || i === n - 1)) {
      areas[i] = Infinity; // Endpoints of open chains are never removed
    } else {
      const pPrev = pts[prevIdx[i]];
      const pCurr = pts[i];
      const pNext = pts[nextIdx[i]];
      areas[i] = triangleArea(pPrev, pCurr, pNext);
    }
  }

  const removed = new Uint8Array(n);
  let remainingCount = n;
  const minKeepCount = isClosed ? 3 : 2;

  while (remainingCount > minKeepCount) {
    let minArea = Infinity;
    let minIdx = -1;

    for (let i = 0; i < n; i++) {
      if (!removed[i] && areas[i] < minArea) {
        minArea = areas[i];
        minIdx = i;
      }
    }

    if (minIdx === -1 || minArea >= thresholdArea) {
      break; // All remaining points exceed area threshold
    }

    // Remove minIdx
    removed[minIdx] = 1;
    remainingCount--;

    const pI = prevIdx[minIdx];
    const nI = nextIdx[minIdx];

    nextIdx[pI] = nI;
    prevIdx[nI] = pI;

    // Recalculate areas for adjacent remaining neighbors
    if (isClosed || pI > 0) {
      const pPrev = pts[prevIdx[pI]];
      const pCurr = pts[pI];
      const pNext = pts[nextIdx[pI]];
      areas[pI] = triangleArea(pPrev, pCurr, pNext);
    }

    if (isClosed || nI < n - 1) {
      const pPrev = pts[prevIdx[nI]];
      const pCurr = pts[nI];
      const pNext = pts[nextIdx[nI]];
      areas[nI] = triangleArea(pPrev, pCurr, pNext);
    }
  }

  // Reconstruct active chain
  const result: Point[] = [];
  let curr = 0;
  if (!isClosed) {
    for (let i = 0; i < n; i++) {
      if (!removed[i]) result.push(pts[i]);
    }
  } else {
    // Find first non-removed index
    while (removed[curr] && curr < n) curr++;
    if (curr < n) {
      let idx = curr;
      do {
        if (!removed[idx]) result.push(pts[idx]);
        idx = nextIdx[idx];
      } while (idx !== curr);
    }
  }

  return result.length >= minKeepCount ? result : [...points];
}
