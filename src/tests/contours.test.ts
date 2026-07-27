import { describe, it, expect } from 'vitest';
import { simplifyDouglasPeucker } from '../contours/simplifyDouglasPeucker';
import { resampleArcLength } from '../contours/resampleArcLength';
import { findContours, computeContourArea } from '../contours/findContours';
import { Point } from '../geometry/point';

describe('Contour Processing & Simplification', () => {
  it('simplifies collinear points with Douglas-Peucker', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0.1 },
      { x: 20, y: -0.1 },
      { x: 30, y: 0.05 },
      { x: 40, y: 0 },
    ];

    const simplified = simplifyDouglasPeucker(pts, 1.0);
    expect(simplified.length).toBe(2);
    expect(simplified[0]).toEqual({ x: 0, y: 0 });
    expect(simplified[1]).toEqual({ x: 40, y: 0 });
  });

  it('resamples points at fixed arc lengths', () => {
    const pts: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    const resampled = resampleArcLength(pts, 10.0);
    expect(resampled.length).toBe(11);
    expect(resampled[1].x).toBeCloseTo(10, 1);
  });

  it('calculates polygon contour area correctly', () => {
    const rect: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 40 },
      { x: 0, y: 40 },
    ];

    const area = computeContourArea(rect);
    expect(area).toBe(2000);
  });

  it('extracts nested contours and identifies holes', () => {
    const width = 20;
    const height = 20;
    const binary = new Uint8Array(width * height);

    // Draw outer 16x16 square
    for (let y = 2; y < 18; y++) {
      for (let x = 2; x < 18; x++) {
        binary[y * width + x] = 255;
      }
    }

    // Carve inner 8x8 hole (0s inside square)
    for (let y = 6; y < 14; y++) {
      for (let x = 6; x < 14; x++) {
        binary[y * width + x] = 0;
      }
    }

    const contours = findContours(binary, width, height, 0, 0);
    expect(contours.length).toBe(2);

    const outer = contours.find((c) => !c.isHole);
    const hole = contours.find((c) => c.isHole);

    expect(outer).toBeDefined();
    expect(hole).toBeDefined();
    expect(hole?.parentId).toBe(outer?.id);
  });
});
