import { Point, distance } from '../geometry/point';

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

        // Count 0-to-1 transitions in ring p2->p3->p4->p5->p6->p7->p8->p9->p2
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

  // 1. Identify Junctions (3+ neighbors) and Endpoints (1 neighbor)
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

  // Helper to trace chain starting at a seed pixel in a given direction
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

      // Stop if reached a junction or endpoint
      if (neighbors.length >= 3 || unvisited.length === 0) {
        break;
      }

      currX = unvisited[0][0];
      currY = unvisited[0][1];
      safety++;
    }

    return chain;
  }

  // Trace starting from Endpoints
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

  // Trace starting from Junctions
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

  // Trace remaining closed loop components
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

  // Filter / prune short stub branches
  return chains.filter((c) => {
    if (c.isClosed) return c.points.length >= 3;
    let len = 0;
    for (let i = 1; i < c.points.length; i++) {
      len += distance(c.points[i - 1], c.points[i]);
    }
    return len >= pruneStubsLength;
  });
}
