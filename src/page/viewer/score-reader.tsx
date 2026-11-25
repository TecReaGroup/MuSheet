import type { PartView, ScoreSummary, SetlistDetail, ViewerPart } from '@contract/api';
import { FileWarning } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { partKey } from '@/entity/part/part-api';
import { markScoreOpened, useUpdateScore } from '@/entity/score/score-api';
import { AnnotationToolbar } from '@/feature/annotation/annotation-toolbar';
import { useAnnotationBook } from '@/feature/annotation/use-annotation-book';
import { MetronomePanel } from '@/feature/metronome/metronome-panel';
import { useScoreTempoSync } from '@/feature/metronome/use-score-tempo-sync';
import { saveReadingPosition } from '@/feature/page-turn/reading-position';
import { usePageTurnKeys } from '@/feature/page-turn/use-page-turn-keys';
import {
  canShowSpread,
  fitInto,
  nextPosition,
  previousPosition,
  type ViewLayout,
  type ViewPosition,
} from '@/feature/page-turn/view-position';
import { prefetchPdfPage } from '@/feature/pdf-render/pdf-page';
import { usePdfDocument } from '@/feature/pdf-render/use-pdf-document';
import { findPlayableIndex, preferredPart, viewerPath } from '@/feature/performance-mode/setlist-route';
import { SetlistDrawer } from '@/feature/performance-mode/setlist-drawer';
import { usePreferenceStore } from '@/feature/preference/preference-store';
import { useViewerGesture } from '@/feature/viewer-gesture/use-viewer-gesture';
import { queryClient } from '@/shared/api/query-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { readText, useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { log } from '@/shared/lib/logger';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { useElementSize } from '@/shared/lib/use-element-size';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import { PageStage } from './page-stage';
import { ViewerBottomBar } from './viewer-bottom-bar';
import { ViewerTopBar } from './viewer-top-bar';
import { VIEWER_TEXT } from './viewer-text';

const PAGE_INDICATOR_MS = 1500;
const ZOOM_RENDER_DELAY_MS = 200;
const TAP_ZONE_RATIO = 1 / 3;

export interface SetlistContext {
  setlist: SetlistDetail;
  index: number;
}

interface ScoreReaderProps {
  score: ScoreSummary;
  part: PartView;
  initialPage: number;
  setlistContext?: SetlistContext;
}

function describePosition(position: ViewPosition, layout: ViewLayout, pageCount: number) {
  if (layout === 'spread' && position.page < pageCount) return `${position.page}–${position.page + 1} / ${pageCount}`;
  if (layout === 'split') return `${position.page}→${position.page + 1} / ${pageCount}`;
  return `${position.page} / ${pageCount}`;
}

/** The reading surface for one part. Mounted per part (keyed by part id) so all reading state starts fresh. */
export function ScoreReader({ score, part, initialPage, setlistContext }: ScoreReaderProps) {
  const navigate = useNavigate();
  const preference = usePreferenceStore();
  const text = useText(VIEWER_TEXT);
  const commonText = useText(COMMON_TEXT);
  const pdfState = usePdfDocument(part.sha256);
  const pdf = pdfState.status === 'ready' ? pdfState.pdf : null;
  const book = useAnnotationBook(part.id);
  const updateScore = useUpdateScore(score.id);
  useScoreTempoSync(score, patch => updateScore.mutate(patch));

  const stageRef = useRef<HTMLDivElement>(null);
  const box = useElementSize(stageRef);
  const [position, setPosition] = useState<ViewPosition>({ page: initialPage, split: false });
  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);
  const [isSetlistOpen, setIsSetlistOpen] = useState(false);
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);
  const indicatorTimer = useRef(0);

  const pageCount = pdf?.pageSizes.length ?? part.pageCount;
  const currentSize = pdf?.pageSizes[position.page - 1];
  const layout: ViewLayout = isEditing
    ? 'single'
    : preference.pageTurn === 'page' && currentSize && canShowSpread(currentSize, box)
      ? 'spread'
      : position.split && preference.pageTurn === 'half' && position.page < pageCount
        ? 'split'
        : 'single';

  useEffect(() => {
    markScoreOpened(score.id).catch(error => log('warn', 'Viewer', 'Marking score opened failed', { message: String(error) }));
  }, [score.id]);

  useEffect(() => {
    saveReadingPosition(part.id, position.page);
  }, [part.id, position.page]);

  const flashIndicator = () => {
    setIsIndicatorVisible(true);
    window.clearTimeout(indicatorTimer.current);
    indicatorTimer.current = window.setTimeout(() => setIsIndicatorVisible(false), PAGE_INDICATOR_MS);
  };
  useEffect(() => () => window.clearTimeout(indicatorTimer.current), []);

  const goToSetlistItem = useCallback((targetIndex: number, startPage: number | 'last') => {
    if (!setlistContext) return;
    const target = setlistContext.setlist.scores[targetIndex];
    const targetPart = target && preferredPart(target, part);
    if (!target || !targetPart) return;
    // The setlist already holds the next score, so seed the viewer query and skip a loading flash.
    queryClient.setQueryData<ViewerPart>(partKey.viewer(targetPart.id), { partId: targetPart.id, score: target });
    navigate(viewerPath(targetPart.id, { id: setlistContext.setlist.id, index: targetIndex }, startPage), { replace: true });
  }, [navigate, part, setlistContext]);

  const goToNeighbourSong = (direction: 1 | -1) => {
    if (!setlistContext) return;
    const targetIndex = findPlayableIndex(setlistContext.setlist.scores, setlistContext.index, direction);
    if (targetIndex < 0) {
      const viewerText = readText(VIEWER_TEXT);
      toast(direction === 1 ? viewerText.lastInSetlist : viewerText.firstInSetlist, { duration: 1500 });
      return;
    }
    if (direction === 1) toast(readText(VIEWER_TEXT).upNext(setlistContext.setlist.scores[targetIndex]!.title), { duration: 2000 });
    goToSetlistItem(targetIndex, direction === 1 ? 1 : 'last');
  };

  const gesture = useViewerGesture(stageRef, {
    onTap: xRatio => {
      if (preference.tapZones && xRatio < TAP_ZONE_RATIO) turn('previous');
      else if (preference.tapZones && xRatio > 1 - TAP_ZONE_RATIO) turn('next');
      else if (!isEditing) setIsChromeVisible(visible => !visible);
    },
    onSwipe: direction => turn(direction),
  });
  const settledZoom = useDebouncedValue(gesture.transform.scale, ZOOM_RENDER_DELAY_MS);
  // Zooming out (or a reset on page turn) applies immediately; zooming in waits for the gesture to settle.
  const renderZoom = Math.min(gesture.transform.scale, settledZoom);

  function turn(direction: 'next' | 'previous') {
    if (!pdf) return;
    const result = direction === 'next'
      ? nextPosition(position, layout, preference.pageTurn, pageCount)
      : previousPosition(position, layout, preference.pageTurn);
    if (result === 'past-end') return goToNeighbourSong(1);
    if (result === 'before-start') return goToNeighbourSong(-1);
    setPosition(result);
    gesture.resetZoom();
    flashIndicator();
  }

  usePageTurnKeys(() => turn('next'), () => turn('previous'));

  useEffect(() => {
    if (!pdf || box.width === 0) return;
    const slot = layout === 'spread' ? { width: box.width / 2, height: box.height } : box;
    const step = layout === 'spread' ? 2 : 1;
    for (const page of [position.page + step, position.page + step + 1, position.page - step]) {
      const size = pdf.pageSizes[page - 1];
      if (!size) continue;
      const fitted = fitInto(size, slot);
      prefetchPdfPage(pdf, page, fitted.width, fitted.height);
    }
  }, [pdf, position.page, layout, box]);

  const startEditing = () => {
    setIsEditing(true);
    setIsChromeVisible(true);
    setPosition(current => ({ ...current, split: false }));
    gesture.resetZoom();
  };

  const pageLabel = describePosition(position, layout, pageCount);

  return (
    <div className="fixed inset-0 overflow-hidden bg-canvas text-fg">
      <div ref={stageRef} className="absolute inset-0 touch-none select-none" {...gesture.bind}>
        {pdf && box.width > 0 && (
          <PageStage
            pdf={pdf}
            layout={layout}
            position={position}
            box={box}
            transform={gesture.transform}
            renderZoom={renderZoom}
            isNightScore={preference.nightScore}
            strokesFor={page => book.strokesOf(page)}
            drawingFor={page => (isEditing && book.isLoaded ? {
              onStroke: stroke => book.addStroke(page, stroke),
              onErase: index => book.removeStroke(page, index),
            } : undefined)}
          />
        )}
        {pdfState.status === 'loading' && <div className="absolute inset-0 flex items-center justify-center"><Spinner className="size-7 animate-deferred-in" /></div>}
        {pdfState.status === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center" onPointerDown={event => event.stopPropagation()}>
            <FileWarning className="size-12 text-fg-subtle" />
            <p className="text-fg-muted">{text.loadFailed}</p>
            <Button onClick={() => window.location.reload()}>{commonText.retry}</Button>
          </div>
        )}
      </div>

      <ViewerTopBar
        score={score}
        part={part}
        visible={isChromeVisible || isEditing}
        backFallback={setlistContext ? `/setlist/${setlistContext.setlist.id}` : `/score/${score.id}`}
        setlistName={setlistContext?.setlist.name}
        onSwitchPart={target => navigate(viewerPath(target.id, setlistContext && { id: setlistContext.setlist.id, index: setlistContext.index }), { replace: true })}
        onOpenSetlist={setlistContext && (() => setIsSetlistOpen(true))}
      />

      {isEditing
        ? (
          <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <AnnotationToolbar book={book} page={position.page} onDone={() => setIsEditing(false)} />
          </div>
        )
        : (
          <ViewerBottomBar
            visible={isChromeVisible}
            pageLabel={pageLabel}
            onPrevious={() => turn('previous')}
            onNext={() => turn('next')}
            onAnnotate={startEditing}
            onToggleMetronome={() => setIsMetronomeOpen(open => !open)}
          />
        )}

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 rounded-full bg-inverse/75 px-3 py-1 text-sm font-medium text-on-inverse tabular-nums transition-opacity duration-300',
          isIndicatorVisible && !isChromeVisible && !isEditing ? 'opacity-100' : 'opacity-0',
        )}
      >
        {pageLabel}
      </div>

      {isMetronomeOpen && (
        <div
          className={cn('absolute right-3 z-30 left-3 sm:left-auto', isEditing ? 'bottom-36' : 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]')}
          onPointerDown={event => event.stopPropagation()}
        >
          <MetronomePanel onClose={() => setIsMetronomeOpen(false)} />
        </div>
      )}

      {setlistContext && (
        <SetlistDrawer
          setlist={setlistContext.setlist}
          currentIndex={setlistContext.index}
          open={isSetlistOpen}
          onOpenChange={setIsSetlistOpen}
          onSelect={index => {
            setIsSetlistOpen(false);
            if (index !== setlistContext.index) goToSetlistItem(index, 1);
          }}
        />
      )}
    </div>
  );
}
