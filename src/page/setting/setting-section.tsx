import { BookOpen, Info, Languages, Monitor, Moon, MoonStar, Palette, Sun, UserRound, type LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { LocaleMenu } from '@/feature/preference/locale-menu';
import { usePreferenceStore, type ThemePreference } from '@/feature/preference/preference-store';
import { useText } from '@/shared/i18n/text';
import { AppIcon, Wordmark } from '@/shared/ui/logo';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Switch } from '@/shared/ui/switch';
import { AccountSection } from './account-section';
import { SettingGroup, SettingRow } from './setting-group';
import { SETTING_TEXT, type SettingSectionKey } from './setting-text';

function AppearanceSection() {
  const { theme, update } = usePreferenceStore();
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
    </SettingGroup>
  );
}

function LanguageSection() {
  const text = useText(SETTING_TEXT);
  return (
    <SettingGroup>
      <SettingRow icon={<Languages />} title={text.interfaceLanguage} control={<LocaleMenu />} />
    </SettingGroup>
  );
}

function ReadingSection() {
  const { nightScore, update } = usePreferenceStore();
  const text = useText(SETTING_TEXT);
  return (
    <SettingGroup>
      <SettingRow icon={<MoonStar />} title={text.nightScore} description={text.nightScoreDescription} control={<Switch label={text.nightScore} checked={nightScore} onChange={nextNightScore => update({ nightScore: nextNightScore })} />} />
    </SettingGroup>
  );
}

function AboutSection() {
  const text = useText(SETTING_TEXT);
  return (
    <SettingGroup>
      <div className="flex flex-col items-center px-6 py-8 text-center">
        <AppIcon className="size-20" />
        <Wordmark className="mt-4 text-[32px]" />
        <p className="mt-1 text-sm text-fg-quiet tabular-nums">{text.version(__APP_VERSION__)}</p>
        <p className="mt-3 max-w-sm text-[13px] text-fg-subtle">{text.tagline}</p>
      </div>
    </SettingGroup>
  );
}

interface SettingSection {
  key: SettingSectionKey;
  icon: LucideIcon;
  Content: ComponentType;
}

export const SETTING_SECTIONS: SettingSection[] = [
  { key: 'account', icon: UserRound, Content: AccountSection },
  { key: 'appearance', icon: Palette, Content: AppearanceSection },
  { key: 'language', icon: Languages, Content: LanguageSection },
  { key: 'reading', icon: BookOpen, Content: ReadingSection },
  { key: 'about', icon: Info, Content: AboutSection },
];
