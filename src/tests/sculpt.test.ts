import { describe, it, expect } from 'vitest';
import { CubicBezier } from '../geometry/point';
import {
  calculateBrushFalloff,
  applyGrabBrush,
  applySmoothBrush,
  applySharpenBrush,
  applyPinchBrush,
} from '../geometry/sculpt';

describe('Blender Grease Pencil-Style Vector Sculpting Engine', () => {
  it('calculates smooth cosine falloff across brush radius', () => {
    expect(calculateBrushFalloff(0, 50)).toBe(1.0);
    expect(calculateBrushFalloff(25, 50)).toBeGreaterThan(0.4);
    expect(calculateBrushFalloff(50, 50)).toBe(0.0);
    expect(calculateBrushFalloff(60, 50)).toBe(0.0);
  });

  it('applies Grab brush displacement to points within brush radius', () => {
    const group: CubicBezier[] = [
      {
        p0: { x: 10, y: 10 },
        c1: { x: 20, y: 10 },
        c2: { x: 30, y: 10 },
        p1: { x: 40, y: 10 },
      },
    ];

    const prevCenter = { x: 10, y: 10 };
    const currCenter = { x: 15, y: 10 }; // Displaced by +5px along X

    const result = applyGrabBrush([group], prevCenter, currCenter, 30, 1.0);

    // p0 is at distance 0 from prevCenter, receives 100% of displacement (+5)
    expect(result[0][0].p0.x).toBeCloseTo(15.0);
    expect(result[0][0].p0.y).toBe(10.0);

    // p1 is at distance 30 (edge of radius 30), receives 0 displacement
    expect(result[0][0].p1.x).toBeCloseTo(40.0);
  });

  it('applies Sharpen brush pulling control handles towards anchor points', () => {
    const group: CubicBezier[] = [
      {
        p0: { x: 0, y: 0 },
        c1: { x: 20, y: 0 },
        c2: { x: 80, y: 0 },
        p1: { x: 100, y: 0 },
      },
    ];

    const brushCenter = { x: 20, y: 0 };
    const result = applySharpenBrush([group], brushCenter, 50, 1.0);

    // C1 handle at (20,0) is near brush center and is pulled towards P0 (0,0)
    expect(result[0][0].c1.x).toBeLessThan(20.0);
  });

  it('applies Pinch brush pulling points towards brush center', () => {
    const group: CubicBezier[] = [
      {
        p0: { x: 10, y: 0 },
        c1: { x: 20, y: 0 },
        c2: { x: 80, y: 0 },
        p1: { x: 90, y: 0 },
      },
    ];

    const brushCenter = { x: 0, y: 0 };
    const result = applyPinchBrush([group], brushCenter, 50, 1.0, false);

    // p0 at (10,0) is pulled left towards (0,0)
    expect(result[0][0].p0.x).toBeLessThan(10.0);
  });
});
