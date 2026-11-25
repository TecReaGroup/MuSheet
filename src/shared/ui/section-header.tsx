import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { COMMON_TEXT } from '../i18n/common-text';
import { useText } from '../i18n/text';
import { cn } from '../lib/class-name';

interface SectionHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  /** Trailing "All" link target. */
  moreTo?: string;
  /** Trailing control, e.g. an add button. */
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ icon, title, moreTo, action, className }: SectionHeaderProps) {
  const text = useText(COMMON_TEXT);
  return (
    <div className={cn('mb-3 flex min-h-9 items-center gap-2', className)}>
      {icon && <span className="text-fg-quiet [&_svg]:size-[18px]">{icon}</span>}
      <h2 className="flex-1 text-[17px] font-semibold tracking-tight text-fg">{title}</h2>
      {moreTo && <Link to={moreTo} className="-mr-1 inline-flex items-center rounded-tag py-1 pl-2 pr-1 text-sm font-medium text-score hover:bg-score-soft">{text.all}<ChevronRight className="size-4" /></Link>}
      {action}
    </div>
  );
}
