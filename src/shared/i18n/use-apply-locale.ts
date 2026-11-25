import { useEffect } from 'react';
import { useLocale } from './locale-store';

/** Mirrors the chosen locale onto `<html lang>` so fonts, hyphenation and screen readers follow it. */
export function useApplyLocale() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
