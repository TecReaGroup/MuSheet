import { ChevronDown, Globe } from 'lucide-react';
import { Menu, MenuCheckItem, MenuContent, MenuTrigger } from '@/shared/ui/menu';
import { LOCALES, useLocaleStore, type Locale } from '@/shared/i18n/locale-store';

// Each label is written in its own language so a user who can't read the current UI still finds theirs.
export const LOCALE_LABEL: Record<Locale, string> = {
  'zh-CN': '简体中文',
  en: 'English',
};

export function LocaleMenu() {
  const { locale, setLocale } = useLocaleStore();

  return (
    <Menu modal={false}>
      <MenuTrigger className="group grid h-9 w-[132px] grid-cols-[16px_1fr_16px] items-center gap-1 rounded-card bg-surface px-3 text-caption font-medium text-fg-title ring-1 ring-border transition-all duration-300 outline-none hover:text-fg hover:ring-fg-faint data-[state=open]:ring-fg-subtle data-[state=open]:shadow-[0_4px_16px_rgb(0_0_0/0.06)]">
        <Globe className="size-4 text-fg-quiet" />
        <span className="text-center">{LOCALE_LABEL[locale]}</span>
        <ChevronDown className="mx-auto size-3.5 text-fg-subtle transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </MenuTrigger>
      <MenuContent
        align="center"
        className="w-(--radix-dropdown-menu-trigger-width) min-w-0 rounded-card border-0 bg-surface p-1 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.18)] ring-1 ring-border/80"
      >
        {LOCALES.map(option => (
          <MenuCheckItem
            key={option}
            checked={option === locale}
            onCheckedChange={() => setLocale(option)}
            className="justify-center rounded-tag px-7 py-2 text-center text-caption text-fg-muted data-[highlighted]:bg-canvas data-[highlighted]:text-fg data-[state=checked]:bg-muted data-[state=checked]:font-medium data-[state=checked]:text-fg [&_svg]:size-3.5 [&_svg]:text-fg!"
          >
            {LOCALE_LABEL[option]}
          </MenuCheckItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
