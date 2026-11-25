import { ChevronRight } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import { cn } from '../lib/class-name';
import { Skeleton } from './skeleton';

interface ListCardProps {
  leading: ReactNode;
  title: ReactNode;
  /** Leads the meta line, joined with " · ", e.g. which library the item belongs to. */
  badge?: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onOpen: () => void;
  onContextMenu?: (event: MouseEvent) => void;
  className?: string;
}

/** Shared row card: leading visual + text block, whole card opens; `trailing` holds actions that must not open it. */
export function ListCard({ leading, title, badge, subtitle, meta, trailing, onOpen, onContextMenu, className }: ListCardProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3.5 rounded-panel border border-border bg-surface py-3 pl-3 pr-1 transition-[background-color,border-color] hover:border-score/30 active:bg-muted/60',
        className,
      )}
      onContextMenu={onContextMenu}
    >
      <button type="button" onClick={onOpen} className="absolute inset-0 rounded-panel" aria-label={typeof title === 'string' ? title : undefined} />
      <div className="pointer-events-none">{leading}</div>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="truncate text-body font-semibold leading-snug text-fg">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-caption text-fg-muted">{subtitle}</div>}
        {(badge || meta) && (
          <div className="mt-1 truncate text-xs text-fg-quiet tabular-nums">
            {badge}
            {badge && meta && ' · '}
            {meta}
          </div>
        )}
      </div>
      {trailing && <div className="relative flex items-center">{trailing}</div>}
      <ChevronRight className="pointer-events-none mr-1.5 size-5 shrink-0 text-fg-faint transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-score" />
    </div>
  );
}

/** Same frame and line rhythm as `ListCard`, so content swaps in without the layout jumping. */
export function ListCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-panel border border-border bg-surface py-3 pl-3 pr-4">
      <Skeleton className="size-12 rounded-card" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}
