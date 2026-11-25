import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from '../lib/class-name';

/** Fixed desktop sidebar; pair the page content with `md:pl-64`. */
export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-canvas px-4 pb-6 pt-7 md:flex">
      {children}
    </aside>
  );
}

interface SidebarLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export function SidebarLink({ to, label, icon: Icon, end }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-card px-3 py-2.5 text-[15px] font-medium transition-[background-color,color,box-shadow]',
        isActive
          ? 'bg-surface text-fg ring-1 ring-border [&_svg]:text-score'
          : 'text-fg-muted hover:bg-muted hover:text-fg',
      )}
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  );
}
