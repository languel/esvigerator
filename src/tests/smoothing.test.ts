import { describe, it, expect } from 'vitest';
import { smoothPoints } from '../contours/smoothing';
import { Point } from '../geometry/point';

describe('Laplacian Moving-Average Point Smoothing Filter', () => {
  it('smooths out stair-step pixel noise while preserving open endpoints', () => {
    const noisyPts: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: -5 },
      { x: 30, y: 5 },
      { x: 40, y: 0 },
    ];

    const smoothed = smoothPoints(noisyPts, 3, false);

    // Endpoints preserved
    expect(smoothed[0]).toEqual({ x: 0, y: 0 });
    expect(smoothed[smoothed.length - 1]).toEqual({ x: 40, y: 0 });

    // Interior noise dampened
    expect(Math.abs(smoothed[2].y)).toBeLessThan(Math.abs(noisyPts[2].y));
  });
});
