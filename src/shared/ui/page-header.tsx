import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Controls docked inside the header band below the title, e.g. tabs and search. */
  children?: ReactNode;
  className?: string;
}

/** Top-level page header: a full-width white band with the large page title. */
export function PageHeader({ title, subtitle, actions, children, className }: PageHeaderProps) {
  return (
    <header className={cn('band mb-5 pb-4 pt-6 md:pt-10', className)}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[30px] font-semibold leading-tight text-fg-title">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-fg-muted tabular-nums">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1 pt-1">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
