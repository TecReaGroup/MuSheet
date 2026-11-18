import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { IconTile } from './icon-tile';

const KIND_LABEL = { score: '乐曲', setlist: '曲目单' };

interface StatCardProps {
  kind: keyof typeof KIND_LABEL;
  count: number | undefined;
  to: string;
}

/** Count tile that links to the matching library tab. */
export function StatCard({ kind, count, to }: StatCardProps) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-panel border border-border bg-surface p-3 shadow-card transition-shadow hover:shadow-lift sm:p-4">
      <IconTile kind={kind} className="size-11" />
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-semibold leading-none text-fg tabular-nums">{count ?? '–'}</span>
        <span className="mt-1 block text-[13px] text-fg-quiet">{KIND_LABEL[kind]}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-fg-faint transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-fg-quiet" />
    </Link>
  );
}
