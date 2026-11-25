import { useEffect, useRef } from 'react';
import { usePreferenceStore } from './preference-store';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function useApplyTheme() {
  const theme = usePreferenceStore(state => state.theme);
  // The first apply happens at boot and must land instantly; only later switches cross-fade.
  const hasApplied = useRef(false);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      const paint = () => {
        document.documentElement.classList.toggle('dark', isDark);
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#09090b' : '#f9fafb');
      };
      const isChanging = document.documentElement.classList.contains('dark') !== isDark;
      if (hasApplied.current && isChanging && 'startViewTransition' in document) document.startViewTransition(paint);
      else paint();
      hasApplied.current = true;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
