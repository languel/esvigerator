import { describe, it, expect } from 'vitest';
import { serializeCubicBeziersToPath } from '../svg/serializePath';
import { generateSvgDocument } from '../svg/exportSvg';
import { CubicBezier } from '../geometry/point';

describe('SVG Serialization & Document Export', () => {
  it('serializes cubic Bézier segments into formatted path string', () => {
    const bezierGroup: CubicBezier[] = [
      {
        p0: { x: 0, y: 0 },
        c1: { x: 10.45, y: 20.67 },
        c2: { x: 30.12, y: 40.89 },
        p1: { x: 50.0, y: 50.0 },
      },
    ];

    const pathData = serializeCubicBeziersToPath([bezierGroup], {
      precision: 1,
      relativeCommands: false,
      closePaths: true,
    });

    expect(pathData).toBe('M 0 0 C 10.5 20.7 30.1 40.9 50 50 Z');
  });

  it('generates a valid SVG XML document with viewBox and fill-rule', () => {
    const svg = generateSvgDocument({
      width: 800,
      height: 600,
      pathData: 'M 0 0 L 100 100 Z',
      fillColor: '#111111',
      fillRule: 'evenodd',
      transparentBackground: true,
      prettyPrint: false,
    });

    expect(svg).toContain('viewBox="0 0 800 600"');
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('d="M 0 0 L 100 100 Z"');
  });
});
