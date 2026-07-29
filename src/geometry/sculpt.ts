import { Point, CubicBezier, distance, add, sub, mul } from './point';

export type SculptToolType = 'grab' | 'smooth' | 'sharpen' | 'pinch' | 'inflate';

export interface SculptBrushOptions {
  tool: SculptToolType;
  radius: number; // in image canvas pixels
  strength: number; // 0.05 to 1.0
}

/**
 * Cosine-squared smooth falloff function.
 * Returns 1.0 at distance 0, decaying smoothly to 0.0 at distance = radius.
 */
export function calculateBrushFalloff(dist: number, radius: number): number {
  if (dist >= radius || radius <= 0) return 0;
  const norm = dist / radius;
  const cosVal = Math.cos((Math.PI * norm) / 2);
  return cosVal * cosVal;
}

/**
 * Grab / Push Brush: Smoothly displaces points within brush radius
 * in the direction of mouse movement.
 */
export function applyGrabBrush(
  groups: CubicBezier[][],
  prevCenter: Point,
  currCenter: Point,
  radius: number,
  strength: number
): CubicBezier[][] {
  const delta = sub(currCenter, prevCenter);
  if (delta.x === 0 && delta.y === 0) return groups;

  return groups.map((group) =>
    group.map((seg) => {
      const p0Dist = distance(seg.p0, prevCenter);
      const c1Dist = distance(seg.c1, prevCenter);
      const c2Dist = distance(seg.c2, prevCenter);
      const p1Dist = distance(seg.p1, prevCenter);

      const w0 = calculateBrushFalloff(p0Dist, radius) * strength;
      const wC1 = calculateBrushFalloff(c1Dist, radius) * strength;
      const wC2 = calculateBrushFalloff(c2Dist, radius) * strength;
      const w1 = calculateBrushFalloff(p1Dist, radius) * strength;

      return {
        p0: add(seg.p0, mul(delta, w0)),
        c1: add(seg.c1, mul(delta, wC1)),
        c2: add(seg.c2, mul(delta, wC2)),
        p1: add(seg.p1, mul(delta, w1)),
      };
    })
  );
}

/**
 * Smooth Brush: Averages control points and handle locations
 * with their adjacent neighbors to smooth out jittery line geometry.
 */
export function applySmoothBrush(
  groups: CubicBezier[][],
  brushCenter: Point,
  radius: number,
  strength: number
): CubicBezier[][] {
  return groups.map((group) => {
    const n = group.length;
    if (n === 0) return group;

    const newGroup = group.map((seg) => ({ ...seg }));

    for (let i = 0; i < n; i++) {
      const seg = group[i];
      const prevSeg = group[(i - 1 + n) % n];
      const nextSeg = group[(i + 1) % n];

      // Smooth P0 anchor
      const p0Dist = distance(seg.p0, brushCenter);
      const w0 = calculateBrushFalloff(p0Dist, radius) * strength * 0.5;
      if (w0 > 0) {
        const avgP0 = {
          x: 0.5 * seg.p0.x + 0.25 * prevSeg.p0.x + 0.25 * nextSeg.p0.x,
          y: 0.5 * seg.p0.y + 0.25 * prevSeg.p0.y + 0.25 * nextSeg.p0.y,
        };
        newGroup[i].p0 = add(mul(seg.p0, 1 - w0), mul(avgP0, w0));
      }

      // Smooth C1 handle
      const c1Dist = distance(seg.c1, brushCenter);
      const wC1 = calculateBrushFalloff(c1Dist, radius) * strength * 0.5;
      if (wC1 > 0) {
        const avgC1 = {
          x: 0.5 * seg.c1.x + 0.5 * seg.p0.x,
          y: 0.5 * seg.c1.y + 0.5 * seg.p0.y,
        };
        newGroup[i].c1 = add(mul(seg.c1, 1 - wC1), mul(avgC1, wC1));
      }

      // Smooth C2 handle
      const c2Dist = distance(seg.c2, brushCenter);
      const wC2 = calculateBrushFalloff(c2Dist, radius) * strength * 0.5;
      if (wC2 > 0) {
        const avgC2 = {
          x: 0.5 * seg.c2.x + 0.5 * seg.p1.x,
          y: 0.5 * seg.c2.y + 0.5 * seg.p1.y,
        };
        newGroup[i].c2 = add(mul(seg.c2, 1 - wC2), mul(avgC2, wC2));
      }
    }

    return newGroup;
  });
}

/**
 * Sharpen Brush: Pulls control handles inward towards their anchor points
 * to sharpen corners and dendrite tips.
 */
export function applySharpenBrush(
  groups: CubicBezier[][],
  brushCenter: Point,
  radius: number,
  strength: number
): CubicBezier[][] {
  return groups.map((group) =>
    group.map((seg) => {
      const c1Dist = distance(seg.c1, brushCenter);
      const c2Dist = distance(seg.c2, brushCenter);

      const wC1 = calculateBrushFalloff(c1Dist, radius) * strength * 0.4;
      const wC2 = calculateBrushFalloff(c2Dist, radius) * strength * 0.4;

      const newC1 = wC1 > 0 ? add(seg.c1, mul(sub(seg.p0, seg.c1), wC1)) : seg.c1;
      const newC2 = wC2 > 0 ? add(seg.c2, mul(sub(seg.p1, seg.c2), wC2)) : seg.c2;

      return {
        ...seg,
        c1: newC1,
        c2: newC2,
      };
    })
  );
}

/**
 * Pinch / Inflate Brush: Pulls points towards brush center (Pinch)
 * or pushes them outward (Inflate).
 */
export function applyPinchBrush(
  groups: CubicBezier[][],
  brushCenter: Point,
  radius: number,
  strength: number,
  isInflate = false
): CubicBezier[][] {
  const dirFactor = isInflate ? -1 : 1;

  return groups.map((group) =>
    group.map((seg) => {
      const mutatePoint = (p: Point) => {
        const d = distance(p, brushCenter);
        const w = calculateBrushFalloff(d, radius) * strength * 0.25;
        if (w <= 0 || d === 0) return p;
        const vec = sub(brushCenter, p);
        return add(p, mul(vec, w * dirFactor));
      };

      return {
        p0: mutatePoint(seg.p0),
        c1: mutatePoint(seg.c1),
        c2: mutatePoint(seg.c2),
        p1: mutatePoint(seg.p1),
      };
    })
  );
}
