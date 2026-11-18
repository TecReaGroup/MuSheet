import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../lib/class-name';

interface SectionHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  /** Trailing "全部" link target. */
  moreTo?: string;
  /** Trailing control, e.g. an add button. */
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ icon, title, moreTo, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex min-h-9 items-center gap-2', className)}>
      {icon && <span className="text-fg-muted [&_svg]:size-5">{icon}</span>}
      <h2 className="flex-1 text-lg font-semibold text-fg">{title}</h2>
      {moreTo && <Link to={moreTo} className="rounded-tag px-2 py-1 text-sm font-semibold text-score hover:bg-score-soft">全部</Link>}
      {action}
    </div>
  );
}
