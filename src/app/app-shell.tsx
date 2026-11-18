import { FileUp, House, Library, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { useImportDialogStore } from '@/feature/score-import/import-dialog-store';
import { cn } from '@/shared/lib/class-name';
import { Button } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/logo';

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: House, end: true },
  { to: '/library', label: '曲库', icon: Library, end: false },
  { to: '/setting', label: '设置', icon: Settings, end: false },
];

function SidebarNav() {
  const openImport = useImportDialogStore(state => state.open);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-3 pb-5 pt-7 md:flex">
      <Logo className="px-2" />
      <nav className="mt-8 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-card px-3 py-2.5 text-[15px] font-medium transition-colors',
              isActive ? 'bg-score-soft font-semibold text-score' : 'text-fg-quiet hover:bg-muted hover:text-fg',
            )}
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Button variant="primary" className="mt-auto w-full" onClick={() => openImport()}>
        <FileUp />
        导入乐谱
      </Button>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface md:hidden">
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
                <Icon className="size-6" strokeWidth={isActive ? 2.25 : 2} />
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
      <main className="overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10 md:pl-60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
