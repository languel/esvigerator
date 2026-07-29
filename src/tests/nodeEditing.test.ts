import { describe, it, expect } from 'vitest';
import { CubicBezier } from '../geometry/point';
import { serializeCubicBeziersToPath } from '../svg/serializePath';

describe('Interactive Vector Node Editing & Path Re-serialization', () => {
  it('updates Bézier control handle coordinates and re-serializes SVG path string', () => {
    const originalGroup: CubicBezier[] = [
      {
        p0: { x: 0, y: 0 },
        c1: { x: 10, y: 0 },
        c2: { x: 20, y: 10 },
        p1: { x: 20, y: 20 },
      },
    ];

    const initialPath = serializeCubicBeziersToPath([originalGroup], { precision: 1, closePaths: false });
    expect(initialPath).toContain('C 10 0 20 10 20 20');

    // Simulate dragging control handle C1 from (10, 0) to (15, -5)
    const updatedGroup: CubicBezier[] = [
      {
        ...originalGroup[0],
        c1: { x: 15, y: -5 },
      },
    ];

    const updatedPath = serializeCubicBeziersToPath([updatedGroup], { precision: 1, closePaths: false });
    expect(updatedPath).toContain('C 15 -5 20 10 20 20');
  });
});
