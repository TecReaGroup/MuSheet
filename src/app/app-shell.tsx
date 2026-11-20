import { House, Library, Settings, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { cn } from '@/shared/lib/class-name';
import { Wordmark } from '@/shared/ui/logo';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

const CONTENT_NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页', icon: House, end: true },
  { to: '/library', label: '曲库', icon: Library, end: false },
];
const SETTING_NAV_ITEM: NavItem = { to: '/setting', label: '设置', icon: Settings, end: false };
const NAV_ITEMS = [...CONTENT_NAV_ITEMS, SETTING_NAV_ITEM];

function SidebarLink({ to, label, icon: Icon, end }: NavItem) {
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

function SidebarNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-canvas px-4 pb-6 pt-7 md:flex">
      <Wordmark className="px-2 text-[32px]" />
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {CONTENT_NAV_ITEMS.map(item => <SidebarLink key={item.to} {...item} />)}
        <div className="mt-auto">
          <SidebarLink {...SETTING_NAV_ITEM} />
        </div>
      </nav>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 backdrop-blur-lg md:hidden">
      <div className="flex">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn(
              'flex flex-1 flex-col items-center gap-1 pb-2 pt-2 text-xs font-medium transition-colors',
              isActive ? 'text-score' : 'text-fg-quiet',
            )}
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition-colors', isActive && 'bg-score-soft')}>
                  <Icon className="size-[22px]" strokeWidth={isActive ? 2.25 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="min-h-full">
      <SidebarNav />
      <main className="overflow-x-clip pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12 md:pl-64">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
