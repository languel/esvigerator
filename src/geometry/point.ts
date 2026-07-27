export interface Point {
  x: number;
  y: number;
}

export interface CubicBezier {
  p0: Point;
  c1: Point;
  c2: Point;
  p1: Point;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function pt(x: number, y: number): Point {
  return { x, y };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(p: Point, scalar: number): Point {
  return { x: p.x * scalar, y: p.y * scalar };
}

export function div(p: Point, scalar: number): Point {
  return scalar === 0 ? { x: 0, y: 0 } : { x: p.x / scalar, y: p.y / scalar };
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

export function lengthSq(p: Point): number {
  return p.x * p.x + p.y * p.y;
}

export function length(p: Point): number {
  return Math.sqrt(lengthSq(p));
}

export function distanceSq(a: Point, b: Point): number {
  return lengthSq(sub(a, b));
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt(distanceSq(a, b));
}

export function normalize(p: Point): Point {
  const len = length(p);
  return len > 1e-12 ? div(p, len) : { x: 0, y: 0 };
}

export function negate(p: Point): Point {
  return { x: -p.x, y: -p.y };
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function angleBetween(a: Point, b: Point): number {
  const dotProd = dot(normalize(a), normalize(b));
  const clampedDot = Math.max(-1, Math.min(1, dotProd));
  return Math.acos(clampedDot);
}

export function turningAngle(p0: Point, p1: Point, p2: Point): number {
  const v1 = normalize(sub(p1, p0));
  const v2 = normalize(sub(p2, p1));
  if (length(v1) === 0 || length(v2) === 0) return 0;
  return angleBetween(v1, v2);
}

export function quantizePoint(p: Point, precision: number | null): Point {
  if (precision === null) return p;
  const factor = Math.pow(10, precision);
  return {
    x: Math.round(p.x * factor) / factor,
    y: Math.round(p.y * factor) / factor,
  };
}

export function computeBounds(points: Point[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}
