import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, NavLink, type RouteObject } from 'react-router';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { PageOutlet } from '@/shared/ui/page-outlet';
import { Sidebar, SidebarLink } from '@/shared/ui/sidebar';
import { SETTING_SECTIONS } from './setting-section';
import { SETTING_TEXT, type SettingSectionKey } from './setting-text';

const SETTING_ROOT = '/setting';
const EXIT_TO = '/';

function ExitLink() {
  const text = useText(COMMON_TEXT);
  return (
    <Link to={EXIT_TO} className="group inline-flex items-center gap-1.5 rounded-card px-2 py-1.5 text-body font-medium text-fg-muted transition-colors hover:text-fg">
      <ArrowLeft className="size-4.5 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transform-none" />
      {text.back}
    </Link>
  );
}

function SettingSidebar() {
  const text = useText(SETTING_TEXT);
  return (
    <Sidebar>
      <div className="flex items-center gap-2">
        <ExitLink />
        <span aria-hidden className="h-4 w-px bg-border" />
        <h1 className="px-2 text-body font-semibold text-fg-title">{text.setting}</h1>
      </div>
      <nav className="mt-6 flex flex-col gap-1">
        {SETTING_SECTIONS.map(({ key, icon }) => <SidebarLink key={key} to={`${SETTING_ROOT}/${key}`} label={text.section[key]} icon={icon} />)}
      </nav>
    </Sidebar>
  );
}

function SettingTopBar() {
  const text = useText(SETTING_TEXT);
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-canvas/85 pt-safe backdrop-blur-lg md:hidden">
      <div className="px-2 pt-2"><ExitLink /></div>
      <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3 pt-2 [scrollbar-width:none]">
        {SETTING_SECTIONS.map(({ key }) => (
          <NavLink
            key={key}
            to={`${SETTING_ROOT}/${key}`}
            className={({ isActive }) => cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              isActive ? 'bg-score-soft text-score' : 'text-fg-muted hover:bg-muted hover:text-fg',
            )}
          >
            {text.section[key]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SectionHeading({ sectionKey }: { sectionKey: SettingSectionKey }) {
  const text = useText(SETTING_TEXT);
  return <h2 className="mb-4 px-1 pt-6 text-xl font-semibold tracking-tight text-fg-title md:pt-10">{text.section[sectionKey]}</h2>;
}

export function SettingLayout() {
  return (
    <div className="min-h-full">
      <SettingSidebar />
      <SettingTopBar />
      <main className="overflow-x-clip pb-[calc(3rem+env(safe-area-inset-bottom))] md:pl-64">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <PageOutlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export const SETTING_ROUTE: RouteObject = {
  path: SETTING_ROOT,
  element: <SettingLayout />,
  children: [
    { index: true, element: <Navigate to={SETTING_SECTIONS[0].key} replace /> },
    ...SETTING_SECTIONS.map(({ key, Content }) => ({
      path: key,
      element: (
        <>
          <SectionHeading sectionKey={key} />
          <Content />
        </>
      ),
    })),
  ],
};
