import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'zh-CN' | 'en';

export const LOCALES: Locale[] = ['zh-CN', 'en'];

// First visit follows the browser; afterwards the user's explicit choice is persisted.
const BROWSER_LOCALE: Locale = navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(persist(
  set => ({
    locale: BROWSER_LOCALE,
    setLocale: locale => set({ locale }),
  }),
  { name: 'musheet.locale', version: 1 },
));

export function useLocale(): Locale {
  return useLocaleStore(state => state.locale);
}
