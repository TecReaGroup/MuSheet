import type { SetlistDetail } from '@contract/api';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { Dialog } from '@/shared/ui/dialog';

interface SetlistDrawerProps {
  setlist: SetlistDetail;
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (index: number) => void;
}

export function SetlistDrawer({ setlist, currentIndex, open, onOpenChange, onSelect }: SetlistDrawerProps) {
  const text = useText(COMMON_TEXT);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={setlist.name} description={text.scoreCount(setlist.scores.length)}>
      <ol className="space-y-1 pb-4">
        {setlist.scores.map((score, index) => {
          const isCurrent = index === currentIndex;
          const isPlayable = score.parts.length > 0;
          return (
            <li key={score.id}>
              <button
                type="button"
                disabled={!isPlayable}
                onClick={() => onSelect(index)}
                aria-current={isCurrent || undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-left transition-colors disabled:opacity-40',
                  isCurrent ? 'bg-setlist-soft text-setlist' : 'hover:bg-muted',
                )}
              >
                <span className={cn('w-6 text-center text-sm font-semibold tabular-nums', isCurrent ? 'text-setlist' : 'text-fg-subtle')}>{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{score.title}</span>
                  {score.composer && <span className="block truncate text-[13px] text-fg-muted">{score.composer}</span>}
                </span>
                <span className="text-xs text-fg-subtle tabular-nums">{score.bpm}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </Dialog>
  );
}
