export interface ExportSvgOptions {
  width: number;
  height: number;
  pathData: string;
  fillColor?: string;
  fillRule?: 'evenodd' | 'nonzero';
  transparentBackground?: boolean;
  backgroundColor?: string;
  includeDimensions?: boolean;
  viewBoxOnly?: boolean;
  prettyPrint?: boolean;
  isStrokeMode?: boolean;
  strokeWidth?: number;
  strokeCap?: 'round' | 'butt' | 'square';
  strokeJoin?: 'round' | 'miter' | 'bevel';
}

export function generateSvgDocument(options: ExportSvgOptions): string {
  const width = Math.round(options.width);
  const height = Math.round(options.height);
  const fillColor = options.fillColor ?? '#111111';
  const fillRule = options.fillRule ?? 'evenodd';
  const transparent = options.transparentBackground ?? true;
  const bgColor = options.backgroundColor ?? '#ffffff';

  const isStroke = options.isStrokeMode ?? false;
  const strokeWidth = options.strokeWidth ?? 2.5;
  const strokeCap = options.strokeCap ?? 'round';
  const strokeJoin = options.strokeJoin ?? 'round';

  const dimAttr = options.includeDimensions && !options.viewBoxOnly ? ` width="${width}" height="${height}"` : '';

  let bgRect = '';
  if (!transparent) {
    bgRect = `  <rect width="100%" height="100%" fill="${bgColor}"/>\n`;
  }

  let pathElement = '';
  if (isStroke) {
    pathElement = `  <path
    d="${options.pathData}"
    fill="none"
    stroke="${fillColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="${strokeCap}"
    stroke-linejoin="${strokeJoin}"/>`;
  } else {
    pathElement = `  <path
    d="${options.pathData}"
    fill="${fillColor}"
    fill-rule="${fillRule}"
    clip-rule="${fillRule}"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"${dimAttr}>
${bgRect}${pathElement}
</svg>`;

  return options.prettyPrint ? svg : svg.replace(/\n\s*/g, ' ').trim();
}

export async function renderSvgToPngBlob(
  svgString: string,
  width: number,
  height: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
