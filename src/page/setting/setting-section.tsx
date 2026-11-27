import { BookOpen, ChartColumn, ExternalLink, Github, Info, Languages, Monitor, Moon, MoonStar, Palette, Settings2, Sun, UserRound, type LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '@/feature/auth/session-api';
import { LibraryStatPanel } from '@/feature/library-stat/library-stat-panel';
import { LocaleSwitch } from '@/feature/preference/locale-switch';
import { usePreferenceStore, type ThemePreference } from '@/feature/preference/preference-store';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { buttonStyle } from '@/shared/ui/button';
import { AppIcon, Wordmark } from '@/shared/ui/logo';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Switch } from '@/shared/ui/switch';
import { AccountSection } from './account-section';
import { PartNameGroup } from './part-name-section';
import { SettingGroup, SettingRow } from './setting-group';
import { SETTING_TEXT, type SettingSectionKey } from './setting-text';

const REPOSITORY_URL = 'https://github.com/TecReaGroup/MuSheet';

function AppearanceSection() {
  const { theme, nightScore, twoPageView, update } = usePreferenceStore();
  const text = useText(SETTING_TEXT);
  return (
    <SettingGroup>
      <SettingRow
        icon={<Palette />}
        title={text.theme}
        control={(
          <SegmentedControl<ThemePreference>
            label={text.theme}
            value={theme}
            onChange={nextTheme => update({ theme: nextTheme })}
            options={[
              { value: 'system', label: text.themeSystem, icon: <Monitor /> },
              { value: 'light', label: text.themeLight, icon: <Sun /> },
              { value: 'dark', label: text.themeDark, icon: <Moon /> },
            ]}
          />
        )}
      />
      <SettingRow icon={<MoonStar />} title={text.nightScore} description={text.nightScoreDescription} control={<Switch label={text.nightScore} checked={nightScore} onChange={nextNightScore => update({ nightScore: nextNightScore })} />} />
      <SettingRow icon={<BookOpen />} title={text.twoPageView} description={text.twoPageViewDescription} control={<Switch label={text.twoPageView} checked={twoPageView} onChange={nextTwoPageView => update({ twoPageView: nextTwoPageView })} />} />
    </SettingGroup>
  );
}

function GeneralSection() {
  const text = useText(SETTING_TEXT);
  return (
    <>
      <SettingGroup>
        <SettingRow icon={<Languages />} title={text.interfaceLanguage} control={<LocaleSwitch label={text.interfaceLanguage} />} />
      </SettingGroup>
      <PartNameGroup />
    </>
  );
}

/** Deep links from non-root accounts fall back to the first section instead of a 403. */
function LibrarySection() {
  const session = useSession().data;
  if (!session) return null;
  return session.isRoot ? <LibraryStatPanel /> : <Navigate to="../account" replace />;
}

function AboutSection() {
  const text = useText(SETTING_TEXT);
  return (
    <SettingGroup>
      <div className="flex flex-col items-center px-6 py-8 text-center">
        <AppIcon className="size-20" />
        <Wordmark className="mt-4 text-[32px]" />
        <p className="mt-1 text-sm text-fg-quiet tabular-nums">{text.version(__APP_VERSION__)}</p>
        <p className="mt-3 max-w-sm text-caption text-fg-subtle">{text.tagline}</p>
        <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className={cn(buttonStyle({ size: 'sm' }), 'mt-5 text-fg-muted hover:text-fg')}>
          <Github />
          GitHub
          <ExternalLink />
        </a>
      </div>
    </SettingGroup>
  );
}

interface SettingSection {
  key: SettingSectionKey;
  icon: LucideIcon;
  Content: ComponentType;
  rootOnly?: true;
}

export const SETTING_SECTIONS: SettingSection[] = [
  { key: 'account', icon: UserRound, Content: AccountSection },
  { key: 'general', icon: Settings2, Content: GeneralSection },
  { key: 'appearance', icon: Palette, Content: AppearanceSection },
  { key: 'library', icon: ChartColumn, Content: LibrarySection, rootOnly: true },
  { key: 'about', icon: Info, Content: AboutSection },
];

/** Sections the current account may open, in sidebar order. */
export function useVisibleSettingSections() {
  const isRoot = useSession().data?.isRoot ?? false;
  return SETTING_SECTIONS.filter(section => isRoot || !section.rootOnly);
}
