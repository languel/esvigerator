import { Point, CubicBezier } from '../geometry/point';
import { CenterlineChain } from '../contours/skeleton';
import { fitCurve, FitOptions } from './cubicFit/fitCurve';
import { serializeCubicBeziersToPath } from '../svg/serializePath';

export interface FitCenterlineResult {
  pathData: string;
  bezierGroups: CubicBezier[][];
  bezierSegmentsTotal: number;
}

export function fitCenterlineChains(
  chains: CenterlineChain[],
  fitOptions: FitOptions,
  precision: number | null = 1,
  relativeCommands = false
): FitCenterlineResult {
  const bezierGroups: CubicBezier[][] = [];
  let bezierSegmentsTotal = 0;

  for (const chain of chains) {
    if (chain.points.length < 2) continue;

    const cubics = fitCurve(chain.points, fitOptions, chain.isClosed);
    bezierGroups.push(cubics);
    bezierSegmentsTotal += cubics.length;
  }

  const pathData = serializeCubicBeziersToPath(bezierGroups, {
    precision,
    relativeCommands,
    closePaths: false, // Centerline stroke paths open/closed per segment
  });

  return {
    pathData,
    bezierGroups,
    bezierSegmentsTotal,
  };
}
