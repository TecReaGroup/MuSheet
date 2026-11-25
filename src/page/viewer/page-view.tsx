import type { Stroke } from '@contract/api';
import { AnnotationLayer, type DrawingHandlers } from '@/feature/annotation/annotation-layer';
import { PdfPage } from '@/feature/pdf-render/pdf-page';
import type { LoadedPdf } from '@/feature/pdf-render/pdf-document-cache';

interface PageViewProps {
  pdf: LoadedPdf;
  pageNumber: number;
  width: number;
  height: number;
  zoom: number;
  /** Omitted when annotations are hidden. */
  strokes?: Stroke[];
  drawing?: DrawingHandlers;
}

/** One sheet: the rendered PDF page with its annotation layer stacked exactly on top. */
export function PageView({ pdf, pageNumber, width, height, zoom, strokes, drawing }: PageViewProps) {
  return (
    <div className="relative shrink-0 shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_2px_12px_rgb(0_0_0/0.08)]" style={{ width, height }}>
      <PdfPage pdf={pdf} pageNumber={pageNumber} width={width} height={height} zoom={zoom} />
      {strokes && <AnnotationLayer strokes={strokes} width={width} height={height} drawing={drawing} />}
    </div>
  );
}
