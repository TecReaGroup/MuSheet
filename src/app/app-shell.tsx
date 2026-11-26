import { House, Library, Settings, UsersRound, type LucideIcon } from 'lucide-react';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { NavLink, useLocation } from 'react-router';
import { UserCard } from '@/feature/auth/user-card';
import { defineText, useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { useScrollActivity } from '@/shared/lib/use-scroll-activity';
import { Wordmark } from '@/shared/ui/logo';
import { PageOutlet } from '@/shared/ui/page-outlet';
import { Sidebar, SidebarLink } from '@/shared/ui/sidebar';

type NavKey = 'home' | 'library' | 'team' | 'setting';

const NAV_TEXT = defineText<Record<NavKey, string>>({
  'zh-CN': { home: '首页', library: '曲库', team: '团队', setting: '设置' },
  en: { home: 'Home', library: 'Library', team: 'Team', setting: 'Settings' },
});

interface NavItem {
  key: NavKey;
  to: string;
  icon: LucideIcon;
  end: boolean;
}

const CONTENT_NAV_ITEMS: NavItem[] = [
  { key: 'home', to: '/', icon: House, end: true },
  { key: 'library', to: '/library', icon: Library, end: false },
  { key: 'team', to: '/team', icon: UsersRound, end: false },
];
const SETTING_NAV_ITEM: NavItem = { key: 'setting', to: '/setting', icon: Settings, end: false };
const NAV_ITEMS = [...CONTENT_NAV_ITEMS, SETTING_NAV_ITEM];

function SidebarNav() {
  const text = useText(NAV_TEXT);
  return (
    <Sidebar>
      <Wordmark className="px-2 text-[32px]" />
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {CONTENT_NAV_ITEMS.map(({ key, to, icon, end }) => <SidebarLink key={to} to={to} label={text[key]} icon={icon} end={end} />)}
        <div className="mb-2 mt-auto">
          <UserCard to={SETTING_NAV_ITEM.to} />
        </div>
      </nav>
    </Sidebar>
  );
}

function BottomNav() {
  const text = useText(NAV_TEXT);
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 backdrop-blur-lg md:hidden">
      <div className="flex">
        {NAV_ITEMS.map(({ key, to, icon: Icon, end }) => (
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
                {text[key]}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/**
 * The content area outlives page changes, so each history entry keeps its own scroll offset:
 * a new page opens at the top, and Back returns to where the list was left.
 * Search-param changes (tabs, queries) stay on the same page and keep the offset.
 */
function useContentScrollRestoration(ref: RefObject<HTMLElement | null>) {
  const { pathname, key } = useLocation();
  const offsetByEntry = useRef(new Map<string, number>());
  const entryKey = useRef(key);

  // Declared first: on a page change the save below still sees the old entry, the restore the new one.
  useLayoutEffect(() => {
    entryKey.current = key;
  }, [key]);

  useLayoutEffect(() => {
    const element = ref.current!;
    element.scrollTop = offsetByEntry.current.get(entryKey.current) ?? 0;
    return () => {
      offsetByEntry.current.set(entryKey.current, element.scrollTop);
    };
  }, [ref, pathname]);
}

export function AppShell() {
  const contentRef = useRef<HTMLElement>(null);
  useScrollActivity(contentRef);
  useContentScrollRestoration(contentRef);
  return (
    // Only the content area scrolls; the sidebar and bottom nav stay put and the page itself never moves.
    <div className="h-dvh overflow-hidden">
      <SidebarNav />
      <main
        ref={contentRef}
        className="thin-scroll h-full overflow-y-auto overflow-x-clip overscroll-contain pb-[calc(6rem+env(safe-area-inset-bottom))] md:ml-64 md:pb-12"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <PageOutlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
