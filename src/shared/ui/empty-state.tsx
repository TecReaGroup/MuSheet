import type { ReactNode } from 'react';
import { cn } from '../lib/class-name';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <div className="mb-4 text-fg-subtle/70 [&_svg]:size-14">{icon}</div>
      <h3 className="text-[17px] font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
