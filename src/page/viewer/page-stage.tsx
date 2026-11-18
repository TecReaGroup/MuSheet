import type { Stroke } from '@contract/api';
import type { DrawingHandlers } from '@/feature/annotation/annotation-layer';
import type { LoadedPdf } from '@/feature/pdf-render/pdf-document-cache';
import { fitInto, type ViewLayout, type ViewPosition } from '@/feature/page-turn/view-position';
import type { ZoomTransform } from '@/feature/viewer-gesture/use-viewer-gesture';
import type { ElementSize } from '@/shared/lib/use-element-size';
import { PageView } from './page-view';

// Breathing room so the page edge never touches the screen edge.
const STAGE_MARGIN_PX = 8;

interface PageStageProps {
  pdf: LoadedPdf;
  layout: ViewLayout;
  position: ViewPosition;
  box: ElementSize;
  transform: ZoomTransform;
  renderZoom: number;
  isNightScore: boolean;
  strokesFor: (page: number) => Stroke[] | undefined;
  drawingFor: (page: number) => DrawingHandlers | undefined;
}

export function PageStage({ pdf, layout, position, box, transform, renderZoom, isNightScore, strokesFor, drawingFor }: PageStageProps) {
  const area = { width: Math.max(0, box.width - STAGE_MARGIN_PX * 2), height: Math.max(0, box.height - STAGE_MARGIN_PX * 2) };
  const pageCount = pdf.pageSizes.length;

  // Slots are keyed by position, not page number, so a turn repaints the same canvas
  // (old page stays visible until the new bitmap is ready) instead of mounting a blank one.
  const renderPage = (slotKey: string, page: number, slot: ElementSize, extra?: Pick<Parameters<typeof PageView>[0], 'style' | 'children'>) => {
    const fitted = fitInto(pdf.pageSizes[page - 1]!, slot);
    return (
      <PageView
        key={slotKey}
        pdf={pdf}
        pageNumber={page}
        width={fitted.width}
        height={fitted.height}
        zoom={renderZoom}
        strokes={strokesFor(page)}
        drawing={drawingFor(page)}
        {...extra}
      />
    );
  };

  let content;
  if (layout === 'spread') {
    const slot = { width: area.width / 2, height: area.height };
    content = (
      <div className="flex items-center justify-center">
        {renderPage('left', position.page, slot)}
        {position.page + 1 <= pageCount && renderPage('right', position.page + 1, slot)}
      </div>
    );
  } else if (layout === 'split') {
    // Bottom half: the end of the current page. Top half: the start of the next one.
    content = (
      <>
        <div className="absolute inset-0 flex items-center justify-center">
          {renderPage('current', position.page, area, { style: { clipPath: 'inset(50% 0 0 0)' } })}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {renderPage('next', position.page + 1, area, {
            style: { clipPath: 'inset(0 0 50% 0)' },
            children: <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-score/50" />,
          })}
        </div>
      </>
    );
  } else {
    content = renderPage('single', position.page, area);
  }

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
