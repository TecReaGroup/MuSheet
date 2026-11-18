import { ListMusic, Music } from 'lucide-react';
import { cn } from '../lib/class-name';

const KIND_ICON = { score: Music, setlist: ListMusic };

const VARIANT_STYLE = {
  soft: {
    score: 'rounded-card from-score-soft to-score-soft-2 text-score-icon',
    setlist: 'rounded-card from-setlist-soft to-setlist-soft-2 text-setlist-icon',
  },
  solid: {
    score: 'rounded-[14px] from-score-solid-from to-score-solid-to text-white',
    setlist: 'rounded-[14px] from-setlist-solid-from to-setlist-solid-to text-white',
  },
};

interface IconTileProps {
  kind: keyof typeof KIND_ICON;
  /** `soft` for list rows, `solid` for the entity header on detail pages. */
  variant?: keyof typeof VARIANT_STYLE;
  className?: string;
}

/** Gradient icon block; blue marks scores and green marks setlists across the whole app. */
export function IconTile({ kind, variant = 'soft', className }: IconTileProps) {
  const Icon = KIND_ICON[kind];
  return (
    <div className={cn('flex size-12 shrink-0 items-center justify-center bg-linear-to-br', VARIANT_STYLE[variant][kind], className)}>
      <Icon className="size-1/2" strokeWidth={2} />
    </div>
  );
}
