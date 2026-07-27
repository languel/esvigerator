export type GrayscaleMode = 'luminance' | 'average' | 'red' | 'green' | 'blue' | 'alpha';
export type ThresholdMode = 'global' | 'otsu' | 'adaptiveMean' | 'adaptiveGaussian';
export type KernelShape = 'square' | 'cross' | 'ellipse';

export interface ImageProcessingOptions {
  grayscaleMode?: GrayscaleMode;
  invert?: boolean;
  contrast?: number; // -100 to 100
  gamma?: number; // 0.1 to 3.0
  thresholdMode?: ThresholdMode;
  thresholdValue?: number; // 0 to 255
  adaptiveBlockSize?: number; // odd integer
  adaptiveConstant?: number;
  minComponentArea?: number;
  minHoleArea?: number;
  blurRadius?: number;
  medianRadius?: number;
  erode?: number;
  dilate?: number;
  open?: number;
  close?: number;
  kernelShape?: KernelShape;
}

export function applyGrayscale(
  imageData: ImageData,
  mode: GrayscaleMode = 'luminance',
  invert = false,
  contrast = 0,
  gamma = 1.0
): Uint8ClampedArray {
  const data = imageData.data;
  const len = data.length;
  const gray = new Uint8ClampedArray(len / 4);

  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const gammaCorrection = 1 / Math.max(0.1, gamma);

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    let val = 0;
    switch (mode) {
      case 'luminance':
        val = 0.299 * r + 0.587 * g + 0.114 * b;
        break;
      case 'average':
        val = (r + g + b) / 3;
        break;
      case 'red':
        val = r;
        break;
      case 'green':
        val = g;
        break;
      case 'blue':
        val = b;
        break;
      case 'alpha':
        val = a;
        break;
    }

    if (contrast !== 0) {
      val = factor * (val - 128) + 128;
    }

    if (gamma !== 1.0) {
      val = 255 * Math.pow(Math.max(0, val / 255), gammaCorrection);
    }

    val = Math.max(0, Math.min(255, val));
    if (invert) val = 255 - val;

    gray[i / 4] = Math.round(val);
  }

  return gray;
}

export function computeOtsuThreshold(gray: Uint8ClampedArray): number {
  const histogram = new Int32Array(256);
  for (let i = 0; i < gray.length; i++) {
    histogram[gray[i]]++;
  }

  const total = gray.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * histogram[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

export function applyThreshold(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  mode: ThresholdMode = 'global',
  thresholdValue = 170,
  blockSize = 15,
  constant = 10,
  invertThreshold = false
): Uint8Array {
  const binary = new Uint8Array(width * height);
  const effectiveValue = mode === 'otsu' ? computeOtsuThreshold(gray) : thresholdValue;

  if (mode === 'global' || mode === 'otsu') {
    for (let i = 0; i < gray.length; i++) {
      const isForeground = gray[i] < effectiveValue;
      binary[i] = (invertThreshold ? !isForeground : isForeground) ? 255 : 0;
    }
    return binary;
  }

  // Adaptive thresholding
  const halfBlock = Math.floor(blockSize / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;

      for (let dy = -halfBlock; dy <= halfBlock; dy++) {
        for (let dx = -halfBlock; dx <= halfBlock; dx++) {
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          sum += gray[ny * width + nx];
          count++;
        }
      }

      const mean = sum / count;
      const thresh = mean - constant;
      const val = gray[y * width + x];
      const isForeground = val < thresh;
      binary[y * width + x] = (invertThreshold ? !isForeground : isForeground) ? 255 : 0;
    }
  }

  return binary;
}

export function filterConnectedComponents(
  binary: Uint8Array,
  width: number,
  height: number,
  minComponentArea = 80,
  minHoleArea = 20
): Uint8Array {
  const labels = new Int32Array(width * height);
  let currentLabel = 1;
  const areaMap = new Map<number, number>();

  // 8-connected component labeling
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] > 0 && labels[idx] === 0) {
        // Flood fill
        const queue: [number, number][] = [[x, y]];
        labels[idx] = currentLabel;
        let area = 0;

        while (queue.length > 0) {
          const [cx, cy] = queue.pop()!;
          area++;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = cx + dx;
              const ny = cy + dy;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (binary[nIdx] > 0 && labels[nIdx] === 0) {
                  labels[nIdx] = currentLabel;
                  queue.push([nx, ny]);
                }
              }
            }
          }
        }

        areaMap.set(currentLabel, area);
        currentLabel++;
      }
    }
  }

  const cleaned = new Uint8Array(width * height);
  for (let i = 0; i < binary.length; i++) {
    const lbl = labels[i];
    if (lbl > 0) {
      const area = areaMap.get(lbl) ?? 0;
      if (area >= minComponentArea) {
        cleaned[i] = 255;
      }
    }
  }

  return cleaned;
}
