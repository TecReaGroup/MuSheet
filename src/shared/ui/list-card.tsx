import type { MouseEvent, ReactNode } from 'react';
import { cn } from '../lib/class-name';

interface ListCardProps {
  leading: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onOpen: () => void;
  onContextMenu?: (event: MouseEvent) => void;
  className?: string;
}

/** Shared row card: leading visual + text block, whole card opens; `trailing` holds actions that must not open it. */
export function ListCard({ leading, title, subtitle, meta, trailing, onOpen, onContextMenu, className }: ListCardProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-card border border-border bg-surface p-3 pr-2 transition-colors hover:border-score/30 hover:bg-score-soft/40',
        className,
      )}
      onContextMenu={onContextMenu}
    >
      <button type="button" onClick={onOpen} className="absolute inset-0 rounded-card" aria-label={typeof title === 'string' ? title : undefined} />
      <div className="pointer-events-none">{leading}</div>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-fg">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-sm text-fg-muted">{subtitle}</div>}
        {meta && <div className="mt-1 truncate text-[13px] text-fg-subtle">{meta}</div>}
      </div>
      {trailing && <div className="relative flex items-center">{trailing}</div>}
    </div>
  );
}
