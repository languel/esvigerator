import { describe, it, expect } from 'vitest';
import { fitCurve } from '../fitting/cubicFit/fitCurve';
import { Point } from '../geometry/point';
import { evaluateBezier } from '../fitting/cubicFit/evaluateBezier';

describe('Schneider Error-Bounded Cubic Fitting', () => {
  it('fits a straight line with a single cubic segment', () => {
    const linePoints: Point[] = [
      { x: 0, y: 0 },
      { x: 25, y: 25 },
      { x: 50, y: 50 },
      { x: 75, y: 75 },
      { x: 100, y: 100 },
    ];

    const result = fitCurve(linePoints, { maxError: 1.0 });
    expect(result.length).toBe(1);
    expect(result[0].p0).toEqual({ x: 0, y: 0 });
    expect(result[0].p1).toEqual({ x: 100, y: 100 });
  });

  it('fits a quarter circle arc within specified max error', () => {
    const arcPoints: Point[] = [];
    const radius = 100;
    for (let i = 0; i <= 20; i++) {
      const angle = (i / 20) * (Math.PI / 2);
      arcPoints.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }

    const result = fitCurve(arcPoints, { maxError: 1.5 });
    expect(result.length).toBeGreaterThan(0);

    // Verify endpoints coincide
    expect(result[0].p0.x).toBeCloseTo(radius, 1);
    expect(result[result.length - 1].p1.y).toBeCloseTo(radius, 1);
  });

  it('decreases segment count as error tolerance increases', () => {
    const sCurve: Point[] = [];
    for (let i = 0; i <= 50; i++) {
      const x = i * 4;
      const y = Math.sin((i / 50) * Math.PI * 2) * 40;
      sCurve.push({ x, y });
    }

    const tightFit = fitCurve(sCurve, { maxError: 0.2 });
    const looseFit = fitCurve(sCurve, { maxError: 5.0 });

    expect(tightFit.length).toBeGreaterThan(looseFit.length);
  });

  it('evaluates cubic Bézier points accurately', () => {
    const curve = {
      p0: { x: 0, y: 0 },
      c1: { x: 0, y: 50 },
      c2: { x: 50, y: 100 },
      p1: { x: 100, y: 100 },
    };

    const start = evaluateBezier(curve, 0);
    const end = evaluateBezier(curve, 1);
    const mid = evaluateBezier(curve, 0.5);

    expect(start).toEqual({ x: 0, y: 0 });
    expect(end).toEqual({ x: 100, y: 100 });
    expect(mid.x).toBeCloseTo(31.25, 2);
    expect(mid.y).toBeCloseTo(68.75, 2);
  });
});
