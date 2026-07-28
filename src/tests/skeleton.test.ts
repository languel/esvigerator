import { describe, it, expect } from 'vitest';
import { zhangSuenThinning, extractSkeletonChains } from '../contours/skeleton';

describe('Centerline Skeleton Extraction & Thinning', () => {
  it('thins a thick line down to a 1-pixel wide skeleton', () => {
    const width = 20;
    const height = 20;
    const binary = new Uint8Array(width * height);

    // Draw a thick horizontal line (width = 6 pixels)
    for (let y = 7; y <= 12; y++) {
      for (let x = 2; x < 18; x++) {
        binary[y * width + x] = 255;
      }
    }

    const skeleton = zhangSuenThinning(binary, width, height);

    // Count non-zero skeleton pixels along vertical slice
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

    // Draw a horizontal line
    for (let x = 2; x < 18; x++) {
      binary[10 * width + x] = 255;
    }

    const skeleton = zhangSuenThinning(binary, width, height);
    const chains = extractSkeletonChains(skeleton, width, height, 1);

    expect(chains.length).toBeGreaterThan(0);
    expect(chains[0].points.length).toBeGreaterThan(5);
  });
});
