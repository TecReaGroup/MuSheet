import { LOCALES, useLocaleStore, type Locale } from '@/shared/i18n/locale-store';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { LOCALE_LABEL } from './locale-menu';

export function LocaleSwitch({ label }: { label: string }) {
  const { locale, setLocale } = useLocaleStore();
  return (
    <SegmentedControl<Locale>
      label={label}
      value={locale}
      onChange={setLocale}
      options={LOCALES.map(option => ({ value: option, label: LOCALE_LABEL[option] }))}
    />
  );
}
