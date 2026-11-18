import { useEffect } from 'react';
import { usePreferenceStore } from './preference-store';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function useApplyTheme() {
  const theme = usePreferenceStore(state => state.theme);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#09090b' : '#f9fafb');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
