import { Point, add, mul } from '../geometry/point';

/**
 * Applies Laplacian / Moving Average smoothing to a point sequence.
 * For open chains, endpoint positions are preserved to prevent dendrite tips from shrinking.
 */
export function smoothPoints(
  points: Point[],
  iterations = 2,
  isClosed = false
): Point[] {
  if (points.length < 3 || iterations <= 0) return [...points];

  let curr = [...points];
  const n = curr.length;

  for (let iter = 0; iter < iterations; iter++) {
    const next: Point[] = new Array(n);

    if (isClosed) {
      for (let i = 0; i < n; i++) {
        const prev = curr[(i - 1 + n) % n];
        const p = curr[i];
        const nxt = curr[(i + 1) % n];
        next[i] = {
          x: 0.25 * prev.x + 0.5 * p.x + 0.25 * nxt.x,
          y: 0.25 * prev.y + 0.5 * p.y + 0.25 * nxt.y,
        };
      }
    } else {
      // Preserve open endpoints
      next[0] = { ...curr[0] };
      next[n - 1] = { ...curr[n - 1] };

      for (let i = 1; i < n - 1; i++) {
        const prev = curr[i - 1];
        const p = curr[i];
        const nxt = curr[i + 1];
        next[i] = {
          x: 0.25 * prev.x + 0.5 * p.x + 0.25 * nxt.x,
          y: 0.25 * prev.y + 0.5 * p.y + 0.25 * nxt.y,
        };
      }
    }

    curr = next;
  }

  return curr;
}
