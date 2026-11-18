import { ChevronRight } from 'lucide-react';
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
        'group relative flex items-center gap-3 rounded-card border border-border bg-surface py-3 pl-3 pr-1 transition-[background-color,border-color,box-shadow] hover:border-score/25 hover:shadow-[0_2px_12px_rgb(0_0_0/0.05)] active:bg-muted/60',
        className,
      )}
      onContextMenu={onContextMenu}
    >
      <button type="button" onClick={onOpen} className="absolute inset-0 rounded-card" aria-label={typeof title === 'string' ? title : undefined} />
      <div className="pointer-events-none">{leading}</div>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="truncate text-base font-semibold leading-snug text-fg">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-sm text-fg-muted">{subtitle}</div>}
        {meta && <div className="mt-0.5 truncate text-xs text-fg-subtle tabular-nums">{meta}</div>}
      </div>
      {trailing && <div className="relative flex items-center">{trailing}</div>}
      <ChevronRight className="pointer-events-none mr-1.5 size-5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}
