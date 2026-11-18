import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Controls docked below the title, e.g. tabs and search. */
  children?: ReactNode;
  className?: string;
}

/** Top-level page header with the large page title. */
export function PageHeader({ title, subtitle, actions, children, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-10', className)}>
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight text-fg-title md:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-fg-quiet tabular-nums">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}
