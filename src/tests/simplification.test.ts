import { describe, it, expect } from 'vitest';
import { simplifyVisvalingamWhyatt } from '../contours/simplifyVisvalingamWhyatt';
import { simplifyCurvatureAdaptive } from '../contours/simplifyCurvatureAdaptive';
import { Point } from '../geometry/point';

describe('Curvature & Area-Based Simplification Algorithms', () => {
  it('Visvalingam-Whyatt preserves sharp dendrite tip spikes while removing flat noise', () => {
    const lineWithSharpTip: Point[] = [
      { x: 0, y: 0 },
      { x: 5, y: 0.01 }, // shallow noise (area = 49.95)
      { x: 10, y: 20 }, // sharp dendrite tip (large area = 99.95)
      { x: 15, y: 0.01 }, // shallow noise (area = 49.95)
      { x: 20, y: 0 },
    ];

    const simplified = simplifyVisvalingamWhyatt(lineWithSharpTip, 60.0, false);

    // Sharp tip at (10, 20) MUST be preserved, micro noise points removed
    const hasTip = simplified.some((p) => p.x === 10 && p.y === 20);
    expect(hasTip).toBe(true);
    expect(simplified.length).toBeLessThan(lineWithSharpTip.length);
  });

  it('Curvature-Adaptive RDP protects sharp turn angles while simplifying smooth runs', () => {
    const lineWithCorner: Point[] = [
      { x: 0, y: 0 },
      { x: 2, y: 0.1 },
      { x: 4, y: 0.2 },
      { x: 10, y: 0 },
      { x: 10, y: 10 }, // 90 degree sharp corner
      { x: 12, y: 10.1 },
      { x: 14, y: 10.2 },
      { x: 20, y: 10 },
    ];

    const simplified = simplifyCurvatureAdaptive(lineWithCorner, 1.5, 20, false);

    // Corner at (10, 0) MUST be preserved
    const hasCorner = simplified.some((p) => p.x === 10 && p.y === 0);
    expect(hasCorner).toBe(true);
  });
});
