import { ListMusic, Music } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { Skeleton } from './skeleton';

const KIND_STYLE = {
  score: { icon: Music, card: 'border-score/15 bg-score-soft hover:bg-score-soft-2', accent: 'text-score-icon' },
  setlist: { icon: ListMusic, card: 'border-setlist/15 bg-setlist-soft hover:bg-setlist-soft-2', accent: 'text-setlist-icon' },
};

interface StatCardProps {
  kind: 'score' | 'setlist';
  count: number | undefined;
  /** Secondary line under the count, e.g. a per-library breakdown. */
  detail?: ReactNode;
  to: string;
}

/** Count tile that links to the matching library tab. */
export function StatCard({ kind, count, detail, to }: StatCardProps) {
  const text = useText(COMMON_TEXT);
  const { icon: Icon, card, accent } = KIND_STYLE[kind];
  return (
    <Link to={to} className={`block rounded-panel border p-3 transition-colors sm:p-4 ${card}`}>
      <span className={`flex items-center gap-2 text-sm font-medium ${accent}`}>
        <Icon className="size-4" strokeWidth={2} />
        {text[kind]}
      </span>
      {count === undefined
        ? <Skeleton className="mt-2 h-5 w-10 bg-surface/70" />
        : <span className="mt-2 block animate-fade-in text-xl font-semibold leading-none text-fg tabular-nums">{count}</span>}
      {detail && <span className="mt-1 block truncate text-xs text-fg-subtle tabular-nums">{detail}</span>}
    </Link>
  );
}
