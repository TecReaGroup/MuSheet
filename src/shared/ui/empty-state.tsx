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
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="mb-4 text-fg-faint [&_svg]:size-16 [&_svg]:stroke-[1.5]">{icon}</div>
      <h3 className="text-lg text-fg-muted">{title}</h3>
      {description && <p className="mt-2 max-w-xs text-sm text-fg-quiet">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
