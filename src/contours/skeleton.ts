import { Point, distance, sub, normalize, dot } from '../geometry/point';

export interface CenterlineChain {
  points: Point[];
  isClosed: boolean;
}

/**
 * Zhang-Suen Parallel Thinning Algorithm
 * Reduces a binary mask (1 = foreground, 0 = background) to a 1-pixel wide skeleton.
 */
export function zhangSuenThinning(
  binaryMask: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const skeleton = new Uint8Array(binaryMask.length);
  for (let i = 0; i < binaryMask.length; i++) {
    skeleton[i] = binaryMask[i] > 0 ? 1 : 0;
  }

  function getP(x: number, y: number): number {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return skeleton[y * width + x];
  }

  let changed = true;
  const toDelete: number[] = [];

  while (changed) {
    changed = false;

    // Sub-iteration 1
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (skeleton[idx] !== 1) continue;

        const p2 = getP(x, y - 1);
        const p3 = getP(x + 1, y - 1);
        const p4 = getP(x + 1, y);
        const p5 = getP(x + 1, y + 1);
        const p6 = getP(x, y + 1);
        const p7 = getP(x - 1, y + 1);
        const p8 = getP(x - 1, y);
        const p9 = getP(x - 1, y - 1);

        const n = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (n < 2 || n > 6) continue;

        let s = 0;
        if (p2 === 0 && p3 === 1) s++;
        if (p3 === 0 && p4 === 1) s++;
        if (p4 === 0 && p5 === 1) s++;
        if (p5 === 0 && p6 === 1) s++;
        if (p6 === 0 && p7 === 1) s++;
        if (p7 === 0 && p8 === 1) s++;
        if (p8 === 0 && p9 === 1) s++;
        if (p9 === 0 && p2 === 1) s++;

        if (s !== 1) continue;

        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;

        toDelete.push(idx);
      }
    }

    if (toDelete.length > 0) {
      changed = true;
      for (let i = 0; i < toDelete.length; i++) {
        skeleton[toDelete[i]] = 0;
      }
      toDelete.length = 0;
    }

    // Sub-iteration 2
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (skeleton[idx] !== 1) continue;

        const p2 = getP(x, y - 1);
        const p3 = getP(x + 1, y - 1);
        const p4 = getP(x + 1, y);
        const p5 = getP(x + 1, y + 1);
        const p6 = getP(x, y + 1);
        const p7 = getP(x - 1, y + 1);
        const p8 = getP(x - 1, y);
        const p9 = getP(x - 1, y - 1);

        const n = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (n < 2 || n > 6) continue;

        let s = 0;
        if (p2 === 0 && p3 === 1) s++;
        if (p3 === 0 && p4 === 1) s++;
        if (p4 === 0 && p5 === 1) s++;
        if (p5 === 0 && p6 === 1) s++;
        if (p6 === 0 && p7 === 1) s++;
        if (p7 === 0 && p8 === 1) s++;
        if (p8 === 0 && p9 === 1) s++;
        if (p9 === 0 && p2 === 1) s++;

        if (s !== 1) continue;

        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;

        toDelete.push(idx);
      }
    }

    if (toDelete.length > 0) {
      changed = true;
      for (let i = 0; i < toDelete.length; i++) {
        skeleton[toDelete[i]] = 0;
      }
      toDelete.length = 0;
    }
  }

  return skeleton;
}

/**
 * Traces 1-pixel skeleton into ordered point chains between junctions/endpoints.
 */
export function extractSkeletonChains(
  skeleton: Uint8Array,
  width: number,
  height: number,
  pruneStubsLength = 5
): CenterlineChain[] {
  const visited = new Uint8Array(skeleton.length);

  function getNeighborIndices(x: number, y: number): [number, number][] {
    const res: [number, number][] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (skeleton[ny * width + nx] === 1) {
            res.push([nx, ny]);
          }
        }
      }
    }
    return res;
  }

  const endpoints: [number, number][] = [];
  const junctions: [number, number][] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (skeleton[idx] === 1) {
        const neighbors = getNeighborIndices(x, y);
        if (neighbors.length === 1) {
          endpoints.push([x, y]);
        } else if (neighbors.length >= 3) {
          junctions.push([x, y]);
        }
      }
    }
  }

  const chains: CenterlineChain[] = [];

  function traceChainFrom(startX: number, startY: number, firstNeighbor: [number, number]): Point[] {
    const chain: Point[] = [{ x: startX, y: startY }];
    let currX = firstNeighbor[0];
    let currY = firstNeighbor[1];

    visited[startY * width + startX] = 1;

    let safety = 0;
    const maxSafety = width * height;

    while (safety < maxSafety) {
      const idx = currY * width + currX;
      chain.push({ x: currX, y: currY });
      visited[idx] = 1;

      const neighbors = getNeighborIndices(currX, currY);
      const unvisited = neighbors.filter(([nx, ny]) => visited[ny * width + nx] === 0);

      if (neighbors.length >= 3 || unvisited.length === 0) {
        break;
      }

      currX = unvisited[0][0];
      currY = unvisited[0][1];
      safety++;
    }

    return chain;
  }

  for (const [epX, epY] of endpoints) {
    const neighbors = getNeighborIndices(epX, epY);
    for (const nb of neighbors) {
      if (visited[nb[1] * width + nb[0]] === 0) {
        const pts = traceChainFrom(epX, epY, nb);
        if (pts.length >= 2) {
          chains.push({ points: pts, isClosed: false });
        }
      }
    }
  }

  for (const [jX, jY] of junctions) {
    const neighbors = getNeighborIndices(jX, jY);
    for (const nb of neighbors) {
      if (visited[nb[1] * width + nb[0]] === 0) {
        const pts = traceChainFrom(jX, jY, nb);
        if (pts.length >= 2) {
          chains.push({ points: pts, isClosed: false });
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (skeleton[idx] === 1 && visited[idx] === 0) {
        const neighbors = getNeighborIndices(x, y);
        if (neighbors.length > 0) {
          const pts = traceChainFrom(x, y, neighbors[0]);
          if (pts.length >= 3) {
            chains.push({ points: pts, isClosed: true });
          }
        }
      }
    }
  }

  return chains.filter((c) => {
    if (c.isClosed) return c.points.length >= 3;
    let len = 0;
    for (let i = 1; i < c.points.length; i++) {
      len += distance(c.points[i - 1], c.points[i]);
    }
    return len >= pruneStubsLength;
  });
}

/**
 * Checks if joining endpoint A to endpoint B is directionally smooth
 * AND does not create a double-back parallel loop along the same branch.
 */
function isSmoothMerge(
  ptsA: Point[],
  ptsB: Point[],
  gapDist: number
): boolean {
  const lenA = ptsA.length;
  const lenB = ptsB.length;
  if (lenA < 2 || lenB < 2) return false;

  if (gapDist <= 2.5) {
    // Check if merging B onto A creates a immediate double-back
    const pA1 = ptsA[lenA - 1];
    const pA2 = ptsA[lenA - 2];
    const pB2 = ptsB[Math.min(lenB - 1, 1)];

    const vA = normalize(sub(pA1, pA2));
    const vB = normalize(sub(pB2, pA1));
    if (dot(vA, vB) < -0.5) return false; // Rejects 180-deg reversal
    return true;
  }

  // Tangent vector pointing OUT of A's end
  const dirA = normalize(sub(ptsA[lenA - 1], ptsA[Math.max(0, lenA - 3)]));
  // Tangent vector pointing INTO B's start
  const dirB = normalize(sub(ptsB[Math.min(lenB - 1, 2)], ptsB[0]));
  // Vector bridging the gap from A's end to B's start
  const dirBridge = normalize(sub(ptsB[0], ptsA[lenA - 1]));

  // 1. Bridge must extend forward from A (dot > 0.4)
  if (dot(dirA, dirBridge) < 0.4) return false;

  // 2. B must continue in a forward direction (dot > 0.3)
  if (dot(dirA, dirB) < 0.3) return false;

  // 3. Overlap check: Ensure chain B is not running parallel back along chain A
  const sampleB = ptsB[Math.min(lenB - 1, 5)];
  for (let i = 0; i < lenA - 3; i += 2) {
    if (distance(ptsA[i], sampleB) < gapDist * 0.8) {
      return false; // Rejects merging parallel double-pass branches
    }
  }

  return true;
}

/**
 * Merges adjacent centerline chains whose endpoints are closer than maxMergeDistance
 * AND directionally aligned. Consolidates fragmented subsegments into long, continuous paths
 * without bridging across distinct parallel branches or creating wild coiled loops.
 */
export function mergeChainsByDistance(
  chains: CenterlineChain[],
  maxMergeDist = 4.0
): CenterlineChain[] {
  if (chains.length < 2 || maxMergeDist <= 0) return chains;

  // Cap effective merge distance to 10px max (gap distances > 10px cross feature boundaries)
  const effectiveMaxDist = Math.min(10.0, maxMergeDist);

  let active = chains.map((c) => ({
    points: [...c.points],
    isClosed: c.isClosed,
  }));

  let mergedAny = true;
  let iterations = 0;
  const maxIterations = active.length * 2;

  while (mergedAny && iterations < maxIterations) {
    mergedAny = false;
    iterations++;
    const next: typeof active = [];
    const used = new Uint8Array(active.length);

    for (let i = 0; i < active.length; i++) {
      if (used[i]) continue;
      const chainA = active[i];

      if (chainA.isClosed || chainA.points.length < 2) {
        next.push(chainA);
        used[i] = 1;
        continue;
      }

      for (let j = i + 1; j < active.length; j++) {
        if (used[j]) continue;
        const chainB = active[j];

        if (chainB.isClosed || chainB.points.length < 2) continue;

        const aStart = chainA.points[0];
        const aEnd = chainA.points[chainA.points.length - 1];
        const bStart = chainB.points[0];
        const bEnd = chainB.points[chainB.points.length - 1];

        // 1. A_end to B_start
        const d1 = distance(aEnd, bStart);
        if (d1 <= effectiveMaxDist && isSmoothMerge(chainA.points, chainB.points, d1)) {
          chainA.points.push(...chainB.points);
          used[j] = 1;
          mergedAny = true;
          break;
        }

        // 2. A_end to B_end (reverse B)
        const d2 = distance(aEnd, bEnd);
        if (d2 <= effectiveMaxDist && isSmoothMerge(chainA.points, [...chainB.points].reverse(), d2)) {
          chainA.points.push(...[...chainB.points].reverse());
          used[j] = 1;
          mergedAny = true;
          break;
        }

        // 3. A_start to B_start (reverse A)
        const d3 = distance(aStart, bStart);
        if (d3 <= effectiveMaxDist && isSmoothMerge([...chainA.points].reverse(), chainB.points, d3)) {
          chainA.points = [...[...chainB.points].reverse(), ...chainA.points];
          used[j] = 1;
          mergedAny = true;
          break;
        }

        // 4. A_start to B_end
        const d4 = distance(aStart, bEnd);
        if (d4 <= effectiveMaxDist && isSmoothMerge([...chainA.points].reverse(), [...chainB.points].reverse(), d4)) {
          chainA.points = [...chainB.points, ...chainA.points];
          used[j] = 1;
          mergedAny = true;
          break;
        }
      }

      next.push(chainA);
      used[i] = 1;
    }

    active = next;
  }

  return active;
}
