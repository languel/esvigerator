# Codex Build Prompt: Local Raster-to-SVG Contour and Curve Fitting Web App

Build a polished standalone browser application for converting high-contrast raster line art into clean, minimal SVG.

The application should run entirely client-side. It should accept dropped or pasted images, expose adjustable raster-processing and contour-fitting parameters, preview the result interactively, and export optimized SVG.

The central purpose is to improve on naive bitmap tracing that produces filled polygonal ribbons with too many points and visibly jagged edges at high zoom. The application must support replacing those polygon boundaries with smooth, adjustable curves, especially cubic Bézier fits with an explicit geometric error tolerance.

The target use case is black or dark line art on a white or light background: diagrams, scientific illustrations, icons, botanical drawings, hand-drawn technical imagery, and similar high-contrast artwork.

Use the attached neuron image as the initial example and test fixture.

---

## Product concept

The application should expose the raster-to-vector process as a visible pipeline:

```text
input image
    ↓
grayscale / channel extraction
    ↓
threshold
    ↓
optional blur and morphology
    ↓
connected-component cleanup
    ↓
contour extraction with hierarchy
    ↓
contour simplification or resampling
    ↓
curve fitting
    ↓
compound SVG path
    ↓
preview and export
```

Do not treat the application as a generic opaque “vectorize” button. The value is that the user can see and adjust the intermediate mask, contour samples, retained points, fitted curves, and export geometry.

The application should make it possible to answer questions such as:

- How much thresholding changed the original line width.
- Which specks or holes were removed.
- How many contour samples were extracted.
- How many points remain after simplification.
- How many Bézier segments were generated.
- How far the fitted path deviates from the source contour.
- Whether the result is a raw polygon, a spline through samples, or an error-bounded Bézier approximation.

---

# Technical constraints

Build this as a Vite + TypeScript application.

React is acceptable and probably preferable for the control panels and state management, but do not make React responsible for per-pixel image processing.

Requirements:

- Entirely local and client-side.
- No account, server, database, or cloud API.
- No image upload to remote services.
- Drag-and-drop, file-picker, and clipboard paste support.
- Responsive desktop-first interface.
- Works in current Chromium, Safari, and Firefox where practical.
- Heavy image processing must run in a Web Worker.
- Preserve image aspect ratio.
- Never allow exported geometry outside the SVG `viewBox`.
- Do not depend on a fixed canvas size.
- Include a bundled example image or make it easy to load the supplied neuron test image.
- Avoid Docker.
- Provide a simple `npm install` / `npm run dev` workflow.
- Add `npm run build`.
- Keep the implementation understandable and modular.

Potential libraries:

- OpenCV.js for thresholding, morphology, connected components, and contour extraction.
- A browser-compatible Potrace implementation, ideally WASM, as an alternate tracing engine.
- Native SVG DOM for vector preview.
- Canvas 2D or OffscreenCanvas for raster and mask preview.
- A small dedicated cubic Bézier fitting implementation for the custom fitting mode.

Paper.js may be used later for direct vector editing, but the first version should not require it. Prefer native SVG for display and export unless Paper.js clearly simplifies a required interaction.

---

# Primary user interface

Use a three-column desktop layout:

```text
left: source and mask controls
center: large preview workspace
right: contour, fitting, and export controls
```

On narrow screens, collapse the side panels into drawers or tabs.

The main preview should occupy most of the screen.

## Top bar

Include:

- Open image
- Load example
- Reset parameters
- Undo
- Redo
- Export SVG
- Export PNG preview
- Project or image filename
- Processing status
- A local-only indicator

## Preview workspace

Support these views:

- Original
- Binary mask
- Contour samples
- Simplified contour
- Fitted vector
- Overlay comparison
- Split comparison

The split comparison should allow the user to drag a divider between:

- original and mask
- original and vector
- mask and vector

Add zoom and pan.

Zoom should support:

- mouse wheel or trackpad
- zoom buttons
- fit to screen
- 100%
- high zoom inspection

At high zoom, vector paths must remain true SVG geometry and should not be rasterized.

Optional overlays:

- all contour sample points
- retained points after simplification
- Bézier anchors
- Bézier control handles
- corner markers
- component bounding boxes
- contour hierarchy depth
- maximum-error locations
- source contour under fitted curve

The point overlay should remain legible without overwhelming the drawing. Use adaptive point size or hide points below a certain zoom.

---

# Processing stages and controls

## 1. Source controls

Expose:

- Grayscale method
  - luminance
  - average
  - red
  - green
  - blue
  - alpha
- Invert
- Crop empty margins
- Crop padding
- Maximum processing dimension
- Downsample method
  - nearest
  - bilinear
  - bicubic where available
- Preserve original dimensions in export
- Optional pre-threshold contrast
- Optional gamma

Downsampling before thresholding should be treated as a regularization control, since large source images often contain antialiasing and JPEG noise that should not become vector geometry.

Suggested defaults:

```text
max processing dimension: 1600 px
crop empty margins: on
crop padding: 12 px
grayscale: luminance
invert: off
```

## 2. Threshold controls

Support:

- Global threshold
- Otsu threshold
- Adaptive mean threshold
- Adaptive Gaussian threshold
- Threshold invert
- Adaptive block size
- Adaptive constant
- Optional two-threshold hysteresis
- Preview histogram

For global threshold, expose a slider from 0–255.

Suggested starting value for the neuron example:

```text
threshold: 170
```

The mask should update interactively, preferably with debouncing during slider movement and full-resolution processing when the user pauses.

## 3. Mask cleanup

Expose:

- Blur radius
- Median filter radius
- Despeckle minimum component area
- Remove holes below area
- Fill holes
- Erode
- Dilate
- Morphological open
- Morphological close
- Kernel shape
  - square
  - cross
  - ellipse
- Preserve thin features
- Bridge narrow gaps
- Remove border-touching components
- Keep largest component only
- Component count display

Suggested defaults:

```text
blur: 0
minimum component area: 80 px²
erode: 0
dilate: 0
open: 0
close: 0
preserve thin features: on
```

Connected-component filtering should be preferred over morphological opening for basic despeckling because opening can destroy narrow terminals, sharp tips, and delicate line gaps.

## 4. Contour extraction

Use contour hierarchy, not only external contours.

Expose:

- Preserve holes
- Outer contours only
- Minimum contour area
- Minimum hole area
- Maximum hierarchy depth
- Include border contours
- Reverse winding
- Fill rule
  - even-odd
  - nonzero
- Display contour index and nesting depth
- Display contour and hole counts

The default mode should preserve nested contours and export a compound path using `fill-rule="evenodd"`.

For OpenCV.js, use the equivalent of:

```python
cv2.findContours(
    mask,
    cv2.RETR_TREE,
    cv2.CHAIN_APPROX_NONE
)
```

Do not use `RETR_EXTERNAL` as the default because it would incorrectly fill interior white regions.

---

# Contour sampling and simplification

The application should preserve access to the original dense contour samples and allow multiple simplification strategies.

## Sampling modes

Support:

- Original pixel contour
- Fixed arc-length resampling
- Douglas–Peucker simplification
- Visvalingam–Whyatt simplification, optional
- Curvature-aware resampling, optional

Controls:

- Simplification tolerance in pixels
- Simplification tolerance relative to perimeter
- Fixed sample spacing
- Minimum segment length
- Maximum segment length
- Preserve corners
- Corner angle threshold
- Preserve local extrema
- Closed-path seam placement

For OpenCV-style simplification, use:

```python
epsilon = perimeter * simplification_ratio
approx = cv2.approxPolyDP(contour, epsilon, True)
```

Suggested default:

```text
simplification ratio: 0.0007
```

Useful range:

```text
0.0003–0.002 × contour perimeter
```

The interface should display:

```text
raw samples: 2,438
retained samples: 86
reduction: 96.5%
```

Do not imply that fewer points always means better output. The user should be able to compare geometric fidelity and complexity.

---

# Curve output modes

Implement these modes as selectable alternatives.

## Mode A: Polygon

Export direct straight segments:

```svg
M x y
L x y
L x y
...
Z
```

This is useful as a diagnostic baseline.

Controls:

- Simplification tolerance
- Coordinate precision
- Close path

## Mode B: Catmull–Rom spline converted to cubic Béziers

Fit a smooth closed spline through the retained points.

For four consecutive points `p0,p1,p2,p3`, convert the segment from `p1` to `p2` into a cubic Bézier:

```text
c1 = p1 + tension × (p2 - p0) / 6
c2 = p2 - tension × (p3 - p1) / 6
```

For standard Catmull–Rom:

```text
tension = 1
```

SVG segment:

```svg
C c1x c1y c2x c2y p2x p2y
```

Expose:

- Tension
- Uniform / chordal / centripetal parameterization
- Closed seam behavior
- Preserve corners
- Corner threshold
- Clamp overshoot

Centripetal Catmull–Rom should be available because it generally behaves better with irregularly spaced points and reduces loops or bulges.

Reference implementation:

```ts
type Point = { x: number; y: number };

type CubicBezier = {
  p0: Point;
  c1: Point;
  c2: Point;
  p1: Point;
};

function catmullRomClosedToCubics(
  points: Point[],
  tension = 1
): CubicBezier[] {
  const n = points.length;
  const curves: CubicBezier[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const c1 = {
      x: p1.x + tension * (p2.x - p0.x) / 6,
      y: p1.y + tension * (p2.y - p0.y) / 6,
    };

    const c2 = {
      x: p2.x - tension * (p3.x - p1.x) / 6,
      y: p2.y - tension * (p3.y - p1.y) / 6,
    };

    curves.push({ p0: p1, c1, c2, p1: p2 });
  }

  return curves;
}
```

This mode passes through retained contour points. It is smooth but should not be presented as an error-bounded fit.

## Mode C: Error-bounded cubic Bézier fitting

This is the main custom mode.

Implement a Schneider-style recursive cubic curve-fitting algorithm based on the approach described in *Graphics Gems*:

1. Accept an ordered sequence of contour points.
2. Estimate endpoint tangents.
3. Parameterize points by chord length.
4. Generate a candidate cubic Bézier.
5. Evaluate the squared distance from each source sample to the curve.
6. Find the sample with maximum error.
7. If the maximum error is below the user tolerance, accept the cubic.
8. If close to tolerance, use Newton–Raphson reparameterization and refit.
9. Otherwise split at the maximum-error point.
10. Recursively fit the left and right sequences.
11. Join segments while preserving continuity where possible.

The main user control is:

```text
maximum fitting error in source pixels
```

Suggested range:

```text
0.1–20 px
```

Suggested default:

```text
1.5 px
```

Low tolerance:

- more Bézier segments
- closer match
- larger SVG

High tolerance:

- fewer segments
- smoother abstraction
- smaller SVG

Expose:

- Maximum error
- Reparameterization iterations
- Maximum recursion depth
- Preserve corners
- Corner angle threshold
- Minimum samples per segment
- Maximum curve span
- Tangent smoothing
- Continuity preference
  - C0
  - G1
  - approximate C1
- Closed-path seam strategy

For closed contours:

- identify a low-curvature seam point
- rotate the contour sequence so fitting begins there
- duplicate the first point at the end if needed
- fit as an open sequence
- reconcile the first and last tangent directions
- avoid visible discontinuity at the seam

A good default seam strategy is:

```text
choose the point with the smallest absolute local curvature,
subject to being away from an explicitly preserved corner
```

Reference structures:

```ts
type Point = {
  x: number;
  y: number;
};

type CubicBezier = {
  p0: Point;
  c1: Point;
  c2: Point;
  p1: Point;
};

type FitOptions = {
  maxError: number;
  maxIterations: number;
  maxDepth: number;
  preserveCorners: boolean;
  cornerAngleDegrees: number;
};
```

High-level API:

```ts
function fitCurve(
  points: Point[],
  options: FitOptions
): CubicBezier[] {
  if (points.length < 2) return [];

  const leftTangent = normalize(sub(points[1], points[0]));
  const rightTangent = normalize(
    sub(points[points.length - 2], points[points.length - 1])
  );

  return fitCubicRecursive(
    points,
    leftTangent,
    rightTangent,
    options,
    0
  );
}
```

Recursive outline:

```ts
function fitCubicRecursive(
  points: Point[],
  leftTangent: Point,
  rightTangent: Point,
  options: FitOptions,
  depth: number
): CubicBezier[] {
  if (points.length === 2) {
    return [makeTwoPointBezier(points[0], points[1], leftTangent, rightTangent)];
  }

  const u = chordLengthParameterize(points);
  let curve = generateBezier(points, u, leftTangent, rightTangent);
  let { maxError, splitIndex } = computeMaxError(points, curve, u);

  if (maxError <= options.maxError * options.maxError) {
    return [curve];
  }

  if (
    maxError <= options.maxError * options.maxError * 4 &&
    options.maxIterations > 0
  ) {
    let parameters = u;

    for (let i = 0; i < options.maxIterations; i++) {
      parameters = reparameterize(points, parameters, curve);
      curve = generateBezier(points, parameters, leftTangent, rightTangent);

      const result = computeMaxError(points, curve, parameters);
      maxError = result.maxError;
      splitIndex = result.splitIndex;

      if (maxError <= options.maxError * options.maxError) {
        return [curve];
      }
    }
  }

  if (depth >= options.maxDepth) {
    return splitIntoFallbackCubics(points);
  }

  const centerTangent = estimateCenterTangent(points, splitIndex);

  const left = fitCubicRecursive(
    points.slice(0, splitIndex + 1),
    leftTangent,
    centerTangent,
    options,
    depth + 1
  );

  const right = fitCubicRecursive(
    points.slice(splitIndex),
    negate(centerTangent),
    rightTangent,
    options,
    depth + 1
  );

  return [...left, ...right];
}
```

Implement the actual linear algebra carefully. Add unit tests for:

- straight line
- shallow arc
- quarter circle
- noisy curve
- sharp corner
- closed oval
- duplicated points
- nearly coincident points

## Mode D: Potrace

Add a Potrace-based tracing mode as a strong reference and alternate output engine.

Expose Potrace-style controls where supported:

- threshold
- turn policy
- turd size / speck area
- alpha max / corner threshold
- curve optimization
- optimization tolerance
- path inversion
- fill color

The interface should make clear that Potrace is a separate tracing engine rather than another post-process applied to the custom contour.

The user should be able to compare:

```text
custom polygon
custom spline
custom error-fit Bézier
Potrace
```

Show output path count, anchor count, command count, and SVG byte size for each.

---

# Contour effects

Add an expandable “Contour Effects” section.

First-release effects:

- Offset contour inward/outward
- Simplify before offset
- Simplify after offset
- Round joins
- Miter joins
- Bevel joins
- Remove small holes
- Fill holes below area
- Smooth convex corners only
- Smooth concave corners only
- Bridge nearby endpoints
- Remove narrow spikes
- Remove shallow bays
- Coordinate quantization
- Normalize winding
- Merge overlapping components where safe

Possible later effects:

- Regularize local ribbon width
- Approximate centerline extraction
- Reconstruct editable strokes
- Variable-width stroke recovery
- Curvature exaggeration
- Hand-drawn perturbation
- Skeleton graph editing
- Branch pruning

Do not implement centerline extraction in the first milestone unless the base tracer is already stable. Treat it as a separate advanced mode.

---

# Important geometric issue: outlined ribbons versus centerlines

The raster line drawing does not directly contain logical SVG strokes. It contains black regions.

A black line becomes a narrow filled ribbon with two boundaries. Smoothing each boundary independently can alter apparent line width:

- opposing boundaries may bow differently
- narrow gaps may collapse
- acute tips may swell
- inner and outer corners may simplify differently
- branch junctions may deform

The first version should use independent contour fitting because it is tractable and faithful.

Document this limitation in the UI.

Add an optional warning when:

- the fitted curve crosses the source contour excessively
- a hole disappears
- two contours intersect after smoothing
- a narrow gap falls below a set width
- fitting changes component topology

A later “stroke recovery” mode may:

1. Skeletonize the binary mask.
2. Detect endpoints and junctions.
3. Trace skeleton chains.
4. Estimate local half-width from a distance transform.
5. Smooth the centerline.
6. Reconstruct a variable-width ribbon or export a centerline stroke.

This is outside the minimum viable implementation.

---

# SVG generation

The custom contour modes should export a compound SVG path whenever practical.

Default form:

```svg
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 WIDTH HEIGHT">
  <path
    d="..."
    fill="#111"
    fill-rule="evenodd"
    clip-rule="evenodd"/>
</svg>
```

Support export options:

- Single compound path
- One path per component
- One path per contour
- Preserve hierarchy groups
- Fill color
- Transparent background
- Optional background rectangle
- Even-odd fill
- Nonzero fill
- Coordinate precision
  - integer
  - 0.1
  - 0.01
  - 0.001
  - full
- Relative commands
- Absolute commands
- Remove redundant commands
- Remove collinear points
- Collapse repeated commands
- Include width and height attributes
- ViewBox only
- Preserve original source dimensions
- Crop to content
- Padding
- SVG metadata
- Pretty printed
- Minified

The coordinate precision default should be:

```text
0.1
```

When rounding coordinates, verify that rounding does not:

- collapse small contours
- invert winding
- merge adjacent vertices
- create zero-length curve segments
- alter topology

If quantization causes invalid geometry, warn and preserve greater precision for the affected path.

Export statistics:

```text
components
contours
holes
raw contour points
retained points
Bézier segments
SVG path commands
SVG byte size
viewBox
maximum measured fit error
mean measured fit error
```

Add a copy-SVG-code action and a download action.

---

# Preview rendering

Use SVG elements for the fitted output rather than rasterizing the vector preview.

For overlays:

- Render source image in Canvas 2D.
- Render mask in Canvas 2D.
- Render vector in SVG.
- Keep all layers aligned under a shared pan/zoom transform.
- Use the same coordinate system throughout processing and export.

At high zoom:

- show actual SVG paths
- avoid pixel snapping that distorts geometry
- allow toggling anti-aliasing of raster layers
- show point and handle overlays
- show contour-to-curve error lines optionally

Maximum-error visualization:

For each accepted cubic segment, determine the source contour sample with the largest deviation and optionally draw:

- a marker at the sample
- the nearest point on the curve
- a connecting line
- the measured pixel error

This should be a diagnostic overlay, off by default.

---

# State and performance

Maintain a structured processing state.

Example:

```ts
type TraceSettings = {
  source: {
    grayscaleMode: "luminance" | "average" | "red" | "green" | "blue" | "alpha";
    invert: boolean;
    maxDimension: number;
    cropEmpty: boolean;
    cropPadding: number;
    gamma: number;
    contrast: number;
  };

  threshold: {
    mode: "global" | "otsu" | "adaptiveMean" | "adaptiveGaussian";
    value: number;
    blockSize: number;
    constant: number;
  };

  cleanup: {
    blurRadius: number;
    medianRadius: number;
    minComponentArea: number;
    minHoleArea: number;
    erode: number;
    dilate: number;
    open: number;
    close: number;
    preserveThinFeatures: boolean;
  };

  contours: {
    preserveHoles: boolean;
    outerOnly: boolean;
    minContourArea: number;
    maxHierarchyDepth: number | null;
    fillRule: "evenodd" | "nonzero";
  };

  sampling: {
    mode: "raw" | "arcLength" | "douglasPeucker";
    simplifyRatio: number;
    simplifyPixels: number;
    sampleSpacing: number;
    preserveCorners: boolean;
    cornerAngleDegrees: number;
  };

  fitting: {
    mode: "polygon" | "catmullRom" | "cubicFit" | "potrace";
    maxError: number;
    tension: number;
    maxIterations: number;
    maxDepth: number;
    seamStrategy: "lowestCurvature" | "firstPoint" | "manual";
  };

  export: {
    pathMode: "compound" | "component" | "contour";
    precision: 0 | 1 | 2 | 3 | null;
    relativeCommands: boolean;
    prettyPrint: boolean;
    includeDimensions: boolean;
    cropToContent: boolean;
    padding: number;
  };
};
```

Use a Web Worker for:

- grayscale
- threshold
- morphology
- connected components
- contour extraction
- simplification
- fitting
- path generation

Use transferable `ArrayBuffer`s where useful.

During slider movement:

- process a reduced-resolution preview immediately
- debounce the full-quality pass
- show “preview” versus “final” status
- allow canceling stale worker jobs
- process only the stage and downstream stages affected by a setting change

Implement stage caching:

```text
source decode
→ grayscale cache
→ mask cache
→ cleaned mask cache
→ contour cache
→ sample cache
→ fit cache
→ SVG cache
```

Changing SVG coordinate precision should not rerun thresholding.

Changing threshold should invalidate mask and all downstream stages.

Changing only curve-fit error should reuse contours and samples.

---

# Suggested project structure

```text
src/
  app/
    App.tsx
    state.ts
    history.ts
    defaults.ts

  components/
    TopBar.tsx
    SourcePanel.tsx
    ThresholdPanel.tsx
    CleanupPanel.tsx
    ContourPanel.tsx
    SamplingPanel.tsx
    FittingPanel.tsx
    EffectsPanel.tsx
    ExportPanel.tsx
    PreviewWorkspace.tsx
    SplitView.tsx
    StatsPanel.tsx
    DropZone.tsx

  image/
    decodeImage.ts
    grayscale.ts
    threshold.ts
    histogram.ts
    morphology.ts
    connectedComponents.ts
    cropBounds.ts

  contours/
    findContours.ts
    contourHierarchy.ts
    contourMetrics.ts
    simplifyDouglasPeucker.ts
    resampleArcLength.ts
    detectCorners.ts
    chooseClosedSeam.ts

  fitting/
    types.ts
    polygon.ts
    catmullRom.ts
    cubicFit/
      fitCurve.ts
      generateBezier.ts
      parameterize.ts
      reparameterize.ts
      evaluateBezier.ts
      computeError.ts
      tangents.ts
    potrace.ts

  geometry/
    point.ts
    vector.ts
    bounds.ts
    intersections.ts
    winding.ts
    quantize.ts

  svg/
    serializePath.ts
    compoundPath.ts
    optimizePath.ts
    exportSvg.ts
    exportPng.ts
    stats.ts

  workers/
    trace.worker.ts
    protocol.ts

  examples/
    neuron.png

  tests/
    cubicFit.test.ts
    contours.test.ts
    svgExport.test.ts
```

---

# Python reference pipeline

The following Python implementation captures the original proof-of-concept pipeline. Use it as behavioral reference for the custom browser path.

It traces visible dark regions as filled contours rather than trying to reconstruct logical centerline strokes.

```python
from pathlib import Path

import cairosvg
import cv2
import numpy as np


def contour_to_cubic_path(points: np.ndarray) -> str:
    pts = [tuple(map(float, point)) for point in points]

    if len(pts) < 3:
        return ""

    commands = [f"M {pts[0][0]:.1f} {pts[0][1]:.1f}"]
    count = len(pts)

    for i in range(count):
        p0 = pts[(i - 1) % count]
        p1 = pts[i]
        p2 = pts[(i + 1) % count]
        p3 = pts[(i + 2) % count]

        c1 = (
            p1[0] + (p2[0] - p0[0]) / 6,
            p1[1] + (p2[1] - p0[1]) / 6,
        )

        c2 = (
            p2[0] - (p3[0] - p1[0]) / 6,
            p2[1] - (p3[1] - p1[1]) / 6,
        )

        commands.append(
            f"C {c1[0]:.1f} {c1[1]:.1f} "
            f"{c2[0]:.1f} {c2[1]:.1f} "
            f"{p2[0]:.1f} {p2[1]:.1f}"
        )

    commands.append("Z")
    return " ".join(commands)


def trace_line_art(
    input_path: str,
    output_path: str,
    threshold: int = 170,
    minimum_component_area: int = 80,
    simplification_ratio: float = 0.0007,
    padding: int = 12,
) -> None:
    image = cv2.imread(input_path)

    if image is None:
        raise FileNotFoundError(input_path)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    _, mask = cv2.threshold(
        gray,
        threshold,
        255,
        cv2.THRESH_BINARY_INV,
    )

    component_count, labels, stats, _ = (
        cv2.connectedComponentsWithStats(mask, connectivity=8)
    )

    clean = np.zeros_like(mask)

    for component in range(1, component_count):
        area = stats[component, cv2.CC_STAT_AREA]

        if area >= minimum_component_area:
            clean[labels == component] = 255

    ys, xs = np.where(clean > 0)

    if len(xs) == 0:
        raise ValueError("No foreground pixels found.")

    x0 = max(0, int(xs.min()) - padding)
    x1 = min(clean.shape[1], int(xs.max()) + padding + 1)
    y0 = max(0, int(ys.min()) - padding)
    y1 = min(clean.shape[0], int(ys.max()) + padding + 1)

    cropped = clean[y0:y1, x0:x1]

    contours, _ = cv2.findContours(
        cropped,
        cv2.RETR_TREE,
        cv2.CHAIN_APPROX_NONE,
    )

    paths = []

    for contour in contours:
        perimeter = cv2.arcLength(contour, True)

        approximate = cv2.approxPolyDP(
            contour,
            perimeter * simplification_ratio,
            True,
        )

        points = approximate[:, 0, :]
        path = contour_to_cubic_path(points)

        if path:
            paths.append(path)

    height, width = cropped.shape
    path_data = "\n".join(paths)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {width} {height}">
  <path
    d="{path_data}"
    fill="#111"
    fill-rule="evenodd"
    clip-rule="evenodd"/>
</svg>
'''

    Path(output_path).write_text(svg, encoding="utf-8")


trace_line_art(
    "input.png",
    "output.svg",
)

cairosvg.svg2png(
    url="output.svg",
    write_to="output-preview.png",
    output_width=1200,
)
```

This reference implementation has an important weakness:

```text
approxPolyDP contour
→ Catmull–Rom-style cubic conversion
```

The resulting spline still depends heavily on the simplified sample distribution. The web application should preserve this as a useful mode, while adding the error-bounded cubic fit as the more principled option.

---

# Default preset for the neuron example

Include a preset named:

```text
Clean line art
```

Suggested values:

```text
max processing dimension: 1600
grayscale: luminance
invert: off

threshold mode: global
threshold: 170

blur: 0
median: 0
minimum component area: 80
minimum hole area: 20
erode: 0
dilate: 0
open: 0
close: 0

preserve holes: on
fill rule: even-odd
crop empty margins: on
crop padding: 12

sampling: Douglas–Peucker
simplification ratio: 0.0007
preserve corners: on
corner threshold: 45°

fitting mode: cubic error fit
maximum error: 1.5 px
reparameterization iterations: 4
maximum recursion depth: 32
closed seam: lowest curvature

export: single compound path
coordinate precision: 0.1
transparent background: on
viewBox only: on
```

Also provide presets:

```text
Literal trace
Smooth icon
Technical diagram
Aggressive simplification
Potrace baseline
```

---

# Validation and testing

## Automated tests

Add unit tests for:

- grayscale conversion
- global threshold
- connected-component removal
- contour hierarchy
- contour winding
- Douglas–Peucker simplification
- fixed arc-length resampling
- Catmull–Rom conversion
- Bézier evaluation
- Newton–Raphson parameter update
- cubic error computation
- recursive cubic fitting
- closed contour seam handling
- coordinate quantization
- SVG serialization
- viewBox bounds
- even-odd hole preservation

## Geometric fitting fixtures

Use synthetic fixtures:

- straight horizontal line
- diagonal line
- quarter circle
- full circle
- ellipse
- S-curve
- rounded rectangle
- sharp V corner
- noisy sine-like contour
- closed organic blob
- contour with repeated samples
- contour with nearly coincident samples
- contour with one extreme outlier

Assertions should include:

- accepted fit remains within tolerance
- no NaN coordinates
- no infinite recursion
- no zero-length segments unless unavoidable
- closed path endpoints coincide
- segment count decreases as tolerance increases
- error does not increase beyond the selected maximum, except where explicitly reported due to quantization
- exported bounds fit within viewBox

## Visual regression

Create screenshot fixtures for:

- source
- mask
- raw contour
- simplified contour
- polygon result
- Catmull–Rom result
- cubic-fit result
- Potrace result
- point overlay
- handle overlay
- split comparison

Use the neuron image as the main visual regression fixture.

At minimum, inspect:

- dendrite tips
- branch junctions
- nucleus shape
- interior white regions
- axon curve
- myelin gaps
- terminal bulbs
- crop boundaries

---

# Milestones

## Milestone 1: functional tracing core

Deliver:

- image load/drop/paste
- grayscale
- global threshold
- connected-component filtering
- contour extraction with hierarchy
- raw polygon preview
- SVG export
- neuron example

## Milestone 2: adjustable geometry

Deliver:

- Douglas–Peucker simplification
- contour sample overlays
- Catmull–Rom cubic mode
- coordinate precision
- statistics
- split comparison

## Milestone 3: error-bounded curve fit

Deliver:

- Schneider-style cubic fitting
- maximum-error slider
- fitting diagnostics
- closed contour seam strategy
- unit tests
- high-zoom inspection

## Milestone 4: alternate engine and effects

Deliver:

- Potrace mode
- morphology
- adaptive threshold
- offset and contour cleanup effects
- preset system
- export optimization

## Milestone 5: polish

Deliver:

- undo/redo
- keyboard shortcuts
- responsive layout
- worker cancellation
- stage caching
- PNG preview export
- visual regression tests
- accessible controls
- README and architecture notes

---

# Acceptance criteria

The application is complete when:

1. A user can drop the neuron image into the browser.
2. The app generates a thresholded mask locally.
3. The app extracts nested contours and preserves holes.
4. The user can inspect raw contour samples.
5. The user can reduce samples with adjustable simplification.
6. The user can switch between polygon, Catmull–Rom, cubic-fit, and Potrace output.
7. Cubic-fit mode exposes a maximum geometric error in source pixels.
8. Increasing fitting error visibly reduces the number of Bézier segments.
9. The fitted SVG remains smooth under deep zoom.
10. The app reports point count, segment count, path count, SVG size, and measured error.
11. The exported SVG uses the correct content bounds and does not clip geometry.
12. The exported SVG preserves transparent background and contour holes.
13. The app works without a server after the page is loaded.
14. No source image leaves the browser.
15. The repository includes tests, a README, and simple development commands.

---

# Design direction

Keep the visual design restrained and tool-like.

Avoid a generic SaaS dashboard appearance.

The preview is the primary object. Controls should be compact, readable, and grouped by pipeline stage.

Use:

- neutral background
- high-contrast preview
- clear numeric fields beside sliders
- collapsible advanced controls
- compact stats
- persistent zoom controls
- subtle status indicators
- no decorative gradients
- no oversized marketing header

The application should feel closer to a small graphics utility or instrument than a web service.

---

# README requirements

Document:

- what the app does
- supported image types
- local-only processing
- installation
- development
- production build
- architecture
- processing pipeline
- curve modes
- meaning of fitting error
- outlined-ribbon limitation
- Potrace comparison
- testing
- known limitations
- future centerline/stroke-recovery work

Include a short explanation of why a raster black line usually becomes a filled contour ribbon rather than an editable SVG stroke.

---

# Final implementation instruction

Start by building the smallest complete vertical slice:

```text
drop image
→ threshold
→ contours
→ polygon SVG
→ Catmull–Rom SVG
→ error-bounded cubic SVG
→ export
```

Do not begin with centerline extraction, direct vector editing, project persistence, or elaborate styling.

Prioritize:

1. correct contour hierarchy
2. predictable curve fitting
3. accurate high-zoom preview
4. useful parameterization
5. valid SVG export
6. clear code structure

Use the supplied neuron image continuously as a visual test. The result should preserve the character and topology of the original line drawing while allowing the user to trade fidelity for smoothness and SVG complexity in a controlled, visible way.
