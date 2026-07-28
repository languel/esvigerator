import { describe, it, expect } from 'vitest';
import { zhangSuenThinning, extractSkeletonChains, mergeChainsByDistance, CenterlineChain } from '../contours/skeleton';

describe('Centerline Skeleton Extraction & Merging', () => {
  it('thins a thick line down to a 1-pixel wide skeleton', () => {
    const width = 20;
    const height = 20;
    const binary = new Uint8Array(width * height);

    for (let y = 7; y <= 12; y++) {
      for (let x = 2; x < 18; x++) {
        binary[y * width + x] = 255;
      }
    }

    const skeleton = zhangSuenThinning(binary, width, height);

    let thinnedWidth = 0;
    for (let y = 0; y < height; y++) {
      if (skeleton[y * width + 10] === 1) {
        thinnedWidth++;
      }
    }

    expect(thinnedWidth).toBe(1);
  });

  it('extracts skeleton chains between endpoints and junction nodes', () => {
    const width = 20;
    const height = 20;
    const binary = new Uint8Array(width * height);

    for (let x = 2; x < 18; x++) {
      binary[10 * width + x] = 255;
    }

    const skeleton = zhangSuenThinning(binary, width, height);
    const chains = extractSkeletonChains(skeleton, width, height, 1);

    expect(chains.length).toBeGreaterThan(0);
    expect(chains[0].points.length).toBeGreaterThan(5);
  });

  it('merges nearby smoothly-aligned chains into continuous stroke paths', () => {
    const chain1: CenterlineChain = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      isClosed: false,
    };
    const chain2: CenterlineChain = {
      points: [
        { x: 12, y: 1 },
        { x: 25, y: 0 },
      ],
      isClosed: false,
    };

    const merged = mergeChainsByDistance([chain1, chain2], 5.0);
    expect(merged.length).toBe(1);
    expect(merged[0].points.length).toBe(4);
    expect(merged[0].points[0]).toEqual({ x: 0, y: 0 });
    expect(merged[0].points[3]).toEqual({ x: 25, y: 0 });
  });

  it('rejects merging when endpoints would form a sharp 180-degree hairpin U-turn double-back', () => {
    // Chain A going left-to-right along Y=0
    const chainA: CenterlineChain = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      isClosed: false,
    };
    // Chain B going right-to-left along parallel line Y=10 (hairpin double-back)
    const chainB: CenterlineChain = {
      points: [
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      isClosed: false,
    };

    // Endpoints (10,0) and (10,10) are 10px apart, but require double-backing
    const merged = mergeChainsByDistance([chainA, chainB], 15.0);
    expect(merged.length).toBe(2); // Retained as separate chains!
  });
});
