export interface PipelineStats {
  componentsCount: number;
  contoursCount: number;
  holesCount: number;
  rawPointsCount: number;
  retainedPointsCount: number;
  reductionPercentage: number;
  bezierSegmentsCount: number;
  pathCommandsCount: number;
  svgByteSize: number;
  viewBox: string;
  maxMeasuredErrorPx: number;
  meanMeasuredErrorPx: number;
}

export function computePipelineStats(
  componentsCount: number,
  contoursCount: number,
  holesCount: number,
  rawPointsCount: number,
  retainedPointsCount: number,
  bezierSegmentsCount: number,
  svgString: string,
  width: number,
  height: number,
  maxErrorPx = 0,
  meanErrorPx = 0
): PipelineStats {
  const reduction =
    rawPointsCount > 0
      ? Math.round((1 - retainedPointsCount / rawPointsCount) * 1000) / 10
      : 0;

  const pathCommandsCount = (svgString.match(/[MCLZcmlz]/g) || []).length;
  const svgByteSize = new TextEncoder().encode(svgString).length;

  return {
    componentsCount,
    contoursCount,
    holesCount,
    rawPointsCount,
    retainedPointsCount,
    reductionPercentage: Math.max(0, reduction),
    bezierSegmentsCount,
    pathCommandsCount,
    svgByteSize,
    viewBox: `0 0 ${width} ${height}`,
    maxMeasuredErrorPx: Math.round(maxErrorPx * 100) / 100,
    meanMeasuredErrorPx: Math.round(meanErrorPx * 100) / 100,
  };
}
