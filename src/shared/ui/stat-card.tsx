import { ListMusic, Music } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../lib/class-name';

const KIND_STYLE = {
  score: { icon: Music, label: '乐曲', className: 'border-score-soft-2 bg-score-soft text-score' },
  setlist: { icon: ListMusic, label: '曲目单', className: 'border-setlist-soft-2 bg-setlist-soft text-setlist' },
};

interface StatCardProps {
  kind: keyof typeof KIND_STYLE;
  count: number | undefined;
  to: string;
}

/** Tinted count tile that links to the matching library tab. */
export function StatCard({ kind, count, to }: StatCardProps) {
  const { icon: Icon, label, className } = KIND_STYLE[kind];
  return (
    <Link to={to} className={cn('block rounded-card border p-4 transition-[filter] hover:brightness-[0.98]', className)}>
      <span className="flex items-center gap-2 text-sm">
        <Icon className="size-5" />
        {label}
      </span>
      <span className="mt-2 block text-2xl text-fg tabular-nums">{count ?? '–'}</span>
    </Link>
  );
}
