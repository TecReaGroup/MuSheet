import { renderPageToCanvas } from '@/shared/lib/pdfjs';
import type { LoadedPdf } from './pdf-document-cache';

const PAGE_CACHE_SIZE = 8;
// iOS Safari silently renders blank canvases above ~16.7M pixels.
const MAX_CANVAS_PIXELS = 16_777_216;
// Snapping widths makes small resizes and neighbour prefetches hit the same cache entry.
const PIXEL_WIDTH_STEP = 64;

const bitmaps = new Map<string, Promise<ImageBitmap>>();

/** Backing-store width for a page shown at `cssWidth`×`cssHeight`, multiplied by zoom and device pixel ratio. */
export function pagePixelWidth(cssWidth: number, cssHeight: number, zoom: number) {
  const scale = (window.devicePixelRatio || 1) * zoom;
  const maxScale = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, cssWidth * cssHeight));
  const width = cssWidth * Math.min(scale, maxScale);
  return Math.max(PIXEL_WIDTH_STEP, Math.round(width / PIXEL_WIDTH_STEP) * PIXEL_WIDTH_STEP);
}

async function drawBitmap(pdf: LoadedPdf, pageNumber: number, pixelWidth: number) {
  const canvas = await renderPageToCanvas(pdf.proxy, pageNumber, pixelWidth);
  const bitmap = await createImageBitmap(canvas);
  canvas.width = 0;
  canvas.height = 0;
  return bitmap;
}

export function renderPageBitmap(pdf: LoadedPdf, pageNumber: number, pixelWidth: number): Promise<ImageBitmap> {
  const key = `${pdf.sha256}:${pageNumber}:${pixelWidth}`;
  const cached = bitmaps.get(key);
  if (cached) {
    bitmaps.delete(key);
    bitmaps.set(key, cached);
    return cached;
  }

  const rendering = drawBitmap(pdf, pageNumber, pixelWidth);
  bitmaps.set(key, rendering);
  rendering.catch(() => bitmaps.delete(key));

  while (bitmaps.size > PAGE_CACHE_SIZE) {
    const [oldestKey, oldest] = bitmaps.entries().next().value!;
    bitmaps.delete(oldestKey);
    // Safe to close: displayed canvases hold their own copy via drawImage.
    oldest.then(bitmap => bitmap.close()).catch(() => undefined);
  }
  return rendering;
}
