import { Check } from 'lucide-react';
import { cn } from '../lib/class-name';
import { IconTile } from './icon-tile';

const TONE_STYLE = {
  score: { row: 'bg-score-soft', mark: 'border-score bg-score' },
  setlist: { row: 'bg-setlist-soft', mark: 'border-setlist bg-setlist' },
};

export interface PickItem {
  id: string;
  kind: 'score' | 'setlist';
  title: string;
  subtitle: string;
}

interface PickListProps {
  items: PickItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Accent of the selected rows, matching the action that consumes the selection. */
  tone: keyof typeof TONE_STYLE;
}

/** Multi-select list for picker dialogs. */
export function PickList({ items, selectedIds, onToggle, tone }: PickListProps) {
  return (
    <ul className="space-y-1 pb-2">
      {items.map(item => {
        const selected = selectedIds.includes(item.id);
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(item.id)}
              className={cn('flex w-full items-center gap-3 rounded-card p-2 text-left transition-colors', selected ? TONE_STYLE[tone].row : 'hover:bg-muted')}
            >
              <IconTile kind={item.kind} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{item.title}</span>
                <span className="block truncate text-[13px] text-fg-muted">{item.subtitle}</span>
              </span>
              <span className={cn('flex size-6 items-center justify-center rounded-full border-2', selected ? cn(TONE_STYLE[tone].mark, 'text-white') : 'border-border')}>
                {selected && <Check className="size-3.5" strokeWidth={3} />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function toggleSelection(selectedIds: string[], id: string) {
  return selectedIds.includes(id) ? selectedIds.filter(selected => selected !== id) : [...selectedIds, id];
}
