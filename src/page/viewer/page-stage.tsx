import type { Stroke } from '@contract/api';
import type { DrawingHandlers } from '@/feature/annotation/annotation-layer';
import type { LoadedPdf } from '@/feature/pdf-render/pdf-document-cache';
import { fitInto, type ViewLayout } from '@/feature/page-turn/view-position';
import type { ZoomTransform } from '@/feature/viewer-gesture/use-viewer-gesture';
import type { ElementSize } from '@/shared/lib/use-element-size';
import { PageView } from './page-view';

// Breathing room so the page edge never touches the screen edge.
const STAGE_MARGIN_PX = 8;

interface PageStageProps {
  pdf: LoadedPdf;
  layout: ViewLayout;
  page: number;
  box: ElementSize;
  transform: ZoomTransform;
  renderZoom: number;
  isNightScore: boolean;
  strokesFor: (page: number) => Stroke[] | undefined;
  drawingFor: (page: number) => DrawingHandlers | undefined;
}

export function PageStage({ pdf, layout, page, box, transform, renderZoom, isNightScore, strokesFor, drawingFor }: PageStageProps) {
  const area = { width: Math.max(0, box.width - STAGE_MARGIN_PX * 2), height: Math.max(0, box.height - STAGE_MARGIN_PX * 2) };
  const pageCount = pdf.pageSizes.length;

  // Slots are keyed by position, not page number, so a turn repaints the same canvas
  // (old page stays visible until the new bitmap is ready) instead of mounting a blank one.
  const renderPage = (slotKey: string, pageNumber: number, slot: ElementSize) => {
    const fitted = fitInto(pdf.pageSizes[pageNumber - 1]!, slot);
    return (
      <PageView
        key={slotKey}
        pdf={pdf}
        pageNumber={pageNumber}
        width={fitted.width}
        height={fitted.height}
        zoom={renderZoom}
        strokes={strokesFor(pageNumber)}
        drawing={drawingFor(pageNumber)}
      />
    );
  };

  const spreadSlot = { width: area.width / 2, height: area.height };
  const content = layout === 'spread'
    ? (
      <div className="flex items-center justify-center">
        {renderPage('left', page, spreadSlot)}
        {page + 1 <= pageCount && renderPage('right', page + 1, spreadSlot)}
      </div>
    )
    : renderPage('single', page, area);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transformOrigin: '0 0',
        filter: isNightScore ? 'invert(1) hue-rotate(180deg)' : undefined,
      }}
    >
      {content}
    </div>
  );
}
