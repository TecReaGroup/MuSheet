import { useEffect, useRef } from 'react';
import { log, serializeError } from '@/shared/lib/logger';
import { pagePixelWidth, renderPageBitmap } from './page-bitmap-cache';
import type { LoadedPdf } from './pdf-document-cache';

interface PdfPageProps {
  pdf: LoadedPdf;
  pageNumber: number;
  width: number;
  height: number;
  /** Zoom factor the backing store should be sharp for; CSS size stays width×height. */
  zoom: number;
}

/**
 * Paints a cached page bitmap. The previous bitmap stays visible until the new one is ready,
 * so zoom re-renders and prefetched page turns never flash white.
 */
export function PdfPage({ pdf, pageNumber, width, height, zoom }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelWidth = pagePixelWidth(width, height, zoom);

  useEffect(() => {
    let cancelled = false;
    renderPageBitmap(pdf, pageNumber, pixelWidth)
      .then(bitmap => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
      })
      .catch(error => log('error', 'PdfRender', 'Rendering page failed', { pageNumber, ...serializeError(error) }));
    return () => { cancelled = true; };
  }, [pdf, pageNumber, pixelWidth]);

  return <canvas ref={canvasRef} style={{ width, height }} className="block bg-white" />;
}

/** Warms the bitmap cache for a page that is about to be shown. */
export function prefetchPdfPage(pdf: LoadedPdf, pageNumber: number, width: number, height: number) {
  if (pageNumber < 1 || pageNumber > pdf.pageSizes.length) return;
  renderPageBitmap(pdf, pageNumber, pagePixelWidth(width, height, 1)).catch(() => undefined);
}
