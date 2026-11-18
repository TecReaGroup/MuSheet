import { ListMusic, Music } from 'lucide-react';
import { cn } from '../lib/class-name';

const KIND_STYLE = {
  score: { icon: Music, className: 'from-score-soft to-score-soft-2 text-score' },
  setlist: { icon: ListMusic, className: 'from-setlist-soft to-setlist-soft-2 text-setlist' },
};

interface IconTileProps {
  kind: keyof typeof KIND_STYLE;
  className?: string;
}

/** Gradient icon block; blue marks scores and green marks setlists across the whole app. */
export function IconTile({ kind, className }: IconTileProps) {
  const { icon: Icon, className: tone } = KIND_STYLE[kind];
  return (
    <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-card bg-gradient-to-br', tone, className)}>
      <Icon className="size-[45%]" strokeWidth={2} />
    </div>
  );
}
