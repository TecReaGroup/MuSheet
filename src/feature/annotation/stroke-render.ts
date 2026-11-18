import type { Stroke } from '@contract/api';
import { getStroke } from 'perfect-freehand';

const HIGHLIGHTER_ALPHA = 0.35;
// Pointer Events report exactly 0.5 when the device has no pressure sensor (mouse, most fingers).
const NO_PRESSURE_VALUE = 0.5;
const ERASER_RADIUS_PX = 12;

function hasRealPressure(stroke: Stroke) {
  return stroke.points.some(([, , pressure]) => pressure !== NO_PRESSURE_VALUE);
}

function outlinePath(stroke: Stroke, width: number, height: number) {
  const points = stroke.points.map(([x, y, pressure]) => [x * width, y * height, pressure]);
  const isPen = stroke.tool === 'pen';
  const outline = getStroke(points, {
    size: Math.max(1, stroke.width * width),
    thinning: isPen ? 0.55 : 0,
    smoothing: 0.5,
    streamline: 0.45,
    simulatePressure: isPen && !hasRealPressure(stroke),
    last: true,
  });
  const path = new Path2D();
  if (outline.length === 0) return path;
  const [first, ...rest] = outline;
  path.moveTo(first![0]!, first![1]!);
  for (const [x, y] of rest) path.lineTo(x!, y!);
  path.closePath();
  return path;
}

export function paintStroke(context: CanvasRenderingContext2D, stroke: Stroke, width: number, height: number) {
  context.save();
  context.fillStyle = stroke.color;
  if (stroke.tool === 'highlighter') {
    context.globalAlpha = HIGHLIGHTER_ALPHA;
    context.globalCompositeOperation = 'multiply';
  }
  context.fill(outlinePath(stroke, width, height));
  context.restore();
}

/** Clears and repaints a canvas whose CSS size is width×height at the device pixel ratio. */
export function paintStrokes(canvas: HTMLCanvasElement, strokes: Stroke[], width: number, height: number) {
  const ratio = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const context = canvas.getContext('2d')!;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  for (const stroke of strokes) paintStroke(context, stroke, width, height);
}

/** Index of the topmost stroke within eraser reach of a point given in CSS pixels, or -1. */
export function findStrokeAt(strokes: Stroke[], x: number, y: number, width: number, height: number) {
  for (let index = strokes.length - 1; index >= 0; index -= 1) {
    const stroke = strokes[index]!;
    const reach = ERASER_RADIUS_PX + (stroke.width * width) / 2;
    const hit = stroke.points.some(([pointX, pointY]) => Math.hypot(pointX * width - x, pointY * height - y) <= reach);
    if (hit) return index;
  }
  return -1;
}
