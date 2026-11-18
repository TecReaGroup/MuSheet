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
        'group relative flex items-center gap-3.5 rounded-panel border border-border bg-surface py-3 pl-3 pr-1 shadow-card transition-[background-color,border-color,box-shadow] hover:border-score/30 hover:shadow-lift active:bg-muted/60',
        className,
      )}
      onContextMenu={onContextMenu}
    >
      <button type="button" onClick={onOpen} className="absolute inset-0 rounded-panel" aria-label={typeof title === 'string' ? title : undefined} />
      <div className="pointer-events-none">{leading}</div>
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold leading-snug text-fg">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-[13px] text-fg-muted">{subtitle}</div>}
        {meta && <div className="mt-1 truncate text-xs text-fg-quiet tabular-nums">{meta}</div>}
      </div>
      {trailing && <div className="relative flex items-center">{trailing}</div>}
      <ChevronRight className="pointer-events-none mr-1.5 size-5 shrink-0 text-fg-faint transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-score" />
    </div>
  );
}
