import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { IconTile } from './icon-tile';

interface StatCardProps {
  kind: 'score' | 'setlist';
  count: number | undefined;
  /** Secondary line under the label, e.g. a per-library breakdown. */
  detail?: ReactNode;
  to: string;
}

/** Count tile that links to the matching library tab. */
export function StatCard({ kind, count, detail, to }: StatCardProps) {
  const text = useText(COMMON_TEXT);
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-panel border border-border bg-surface p-3 transition-colors hover:border-score/30 sm:p-4">
      <IconTile kind={kind} className="size-11" />
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-semibold leading-none text-fg tabular-nums">{count ?? '–'}</span>
        <span className="mt-1 block text-[13px] text-fg-quiet">{text[kind]}</span>
        {detail && <span className="mt-0.5 block truncate text-xs text-fg-subtle tabular-nums">{detail}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-fg-faint transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-fg-quiet" />
    </Link>
  );
}
