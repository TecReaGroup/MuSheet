import { ChevronLeft, ChevronRight, PenLine } from 'lucide-react';
import { useMetronomeStore } from '@/feature/metronome/metronome-store';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { Button, IconButton } from '@/shared/ui/button';
import { MetronomeIcon } from '@/shared/ui/metronome-icon';
import { VIEWER_TEXT } from './viewer-text';

interface ViewerBottomBarProps {
  visible: boolean;
  pageLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onAnnotate: () => void;
  onToggleMetronome: () => void;
}

const FLOATING_STYLE = 'rounded-full border border-border bg-surface/90 shadow-float backdrop-blur';

export function ViewerBottomBar({ visible, pageLabel, onPrevious, onNext, onAnnotate, onToggleMetronome }: ViewerBottomBarProps) {
  const isMetronomePlaying = useMetronomeStore(state => state.isPlaying);
  const currentBeat = useMetronomeStore(state => state.currentBeat);
  const text = useText(VIEWER_TEXT);

  return (
    <footer
      onPointerDown={event => event.stopPropagation()}
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 [&_*]:pointer-events-none!',
      )}
    >
      <Button className={cn(FLOATING_STYLE, 'pointer-events-auto h-11 px-4')} variant="secondary" onClick={onAnnotate}>
        <PenLine />
        <span className="hidden sm:inline">{text.annotate}</span>
      </Button>

      <div className={cn(FLOATING_STYLE, 'pointer-events-auto flex items-center')}>
        <IconButton label={text.previousPage} onClick={onPrevious}><ChevronLeft /></IconButton>
        <span className="min-w-16 text-center text-sm font-medium tabular-nums">{pageLabel}</span>
        <IconButton label={text.nextPage} onClick={onNext}><ChevronRight /></IconButton>
      </div>

      <Button className={cn(FLOATING_STYLE, 'pointer-events-auto relative h-11 px-4')} variant="secondary" onClick={onToggleMetronome} aria-label={text.metronome}>
        <MetronomeIcon />
        <span className="hidden sm:inline">{text.metronome}</span>
        {isMetronomePlaying && (
          <span className={cn('absolute right-2 top-2 size-2 rounded-full transition-colors duration-75', currentBeat === 0 ? 'bg-setlist' : 'bg-score')} />
        )}
      </Button>
    </footer>
  );
}
