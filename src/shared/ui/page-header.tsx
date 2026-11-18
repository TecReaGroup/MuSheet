import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';
import { useGoBack } from '../lib/use-go-back';
import { IconButton } from './button';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Shows a back button that returns to the previous entry, or to `backTo` when opened directly. */
  backTo?: string;
  actions?: ReactNode;
  className?: string;
}

function BackButton({ fallback }: { fallback: string }) {
  const goBack = useGoBack(fallback);
  return (
    <IconButton label="返回" onClick={goBack} className="-ml-2 mt-0.5">
      <ChevronLeft />
    </IconButton>
  );
}

export function PageHeader({ title, subtitle, backTo, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-start gap-2 pb-5 pt-6 md:pt-10', className)}>
      {backTo && <BackButton fallback={backTo} />}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[28px] font-bold leading-tight tracking-[-0.02em] text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted tabular-nums">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1 pt-0.5">{actions}</div>}
    </header>
  );
}
