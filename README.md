# Diagramator - Local Raster-to-SVG Contour & Curve Fitting Web App

Diagramator is a modern standalone web application for converting high-contrast raster line art (such as scientific illustrations, diagrams, botanical drawings, and technical hand-drawn imagery) into clean, minimal SVG vector paths.

It runs **100% locally and client-side** in your browser. No image data is ever uploaded to external servers or cloud services.

---

## Key Features

- **Local & Private**: All image processing and curve fitting run client-side in a Web Worker using OffscreenCanvas and typed arrays.
- **Schneider Error-Bounded Bézier Fitting**: Replaces jagged polygonal outlines with smooth cubic Bézier curves fitted within an explicit pixel error tolerance ($0.1$ to $15.0$ px).
- **Multiple Curve Output Modes**:
  - **Custom Schneider Error-Bounded Bézier**: Recursive least-squares curve fitting with Newton-Raphson reparameterization.
  - **Catmull-Rom Spline**: Smooth cubic Bézier spline passing through retained contour points with adjustable tension.
  - **Polygon**: Diagnostic baseline output (`M L ... Z`).
  - **Potrace Baseline**: Built-in Potrace engine for direct comparison.
- **Hierarchical Contour & Hole Extraction**: Preserves nested interior white regions (`fill-rule="evenodd"`).
- **Interactive Pan & High-Zoom Inspection**: Native SVG vector rendering for smooth zooming up to 5000% without pixelation.
- **Diagnostic Overlays**: Toggle visibility for raw sample points, retained simplified points, Bézier control handles, and component bounding boxes.
- **Split Comparison View**: Draggable split-screen slider comparing Original vs Vector, Original vs Mask, or Mask vs Vector.
- **Export Options**: Download clean SVG, copy raw SVG path code, or export PNG preview rendering.
- **Pre-packaged Presets**: Quick presets including *Clean line art* (default for neuron diagram), *Literal trace*, *Smooth icon*, *Technical diagram*, *Aggressive simplification*, and *Potrace baseline*.

---

## Getting Started

### Prerequisites

- Node.js 18+ and `npm`

### Installation

```bash
git clone <repository-url>
cd diagramator
npm install
```

### Development Server

Start the local development server on `http://localhost:3000`:

```bash
npm run dev
```

### Production Build

Type-check and build the optimized static asset bundle in `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Run Automated Tests

Run the Vitest test suite covering point math, Schneider curve fitting, contour hierarchy extraction, and SVG serialization:

```bash
npm test
```

---

## Technical Architecture & Pipeline

```text
Input Image (File / Drop / Paste / Example)
    ↓
Grayscale Extraction & Preprocessing (Luminance, Contrast, Gamma)
    ↓
Thresholding (Global Manual, Otsu Auto, Adaptive Mean/Gaussian)
    ↓
Mask Cleanup & Despeckling (Connected Components & Hole Removal)
    ↓
Hierarchical Contour Extraction (Suzuki Border Following with Nesting Depth)
    ↓
Contour Sampling & Simplification (Douglas–Peucker / Arc-Length Resampling)
    ↓
Curve Fitting Engine (Schneider Error-Bounded Cubic Fit / Catmull-Rom / Potrace)
    ↓
SVG Compound Path Serialization & Quantization
    ↓
Interactive Preview & Local Export (SVG / PNG)
```

All heavy image thresholding, despeckling, contour extraction, and recursive curve fitting run in an isolated Web Worker (`src/workers/trace.worker.ts`) to maintain 60 FPS UI responsiveness.

---

## Geometric Note: Outlined Ribbons vs. Centerlines

Raster line art does not contain native vector stroke definitions—it consists of dark pixel regions. 

When thresholded, a black line becomes a **filled ribbon with two boundaries** (an upper contour and a lower contour). Diagramator traces these filled boundaries faithful to the raster shape.

*Why boundary curve fitting differs from single centerline strokes:*
- Opposing ribbon boundaries may simplify at slightly different point distributions.
- Adjusting curve fitting error alters the width of very narrow lines slightly.

Future updates may introduce a dedicated skeletonization centerline recovery mode.

---

## License

MIT License.
