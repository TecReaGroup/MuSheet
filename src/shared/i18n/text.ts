import { useLocaleStore, type Locale } from './locale-store';

/** One copy deck per locale; values are strings, or functions when the copy embeds values. */
export type TextCatalog<T> = Record<Locale, T>;

/**
 * Declares a feature's copy. The Chinese deck defines the shape and every other locale
 * must match it exactly, so a missing translation is a type error rather than a blank label.
 */
export function defineText<T>(catalog: { 'zh-CN': T; en: NoInfer<T> }): TextCatalog<T> {
  return catalog;
}

/** Copy for the current locale; the component re-renders when the locale changes. */
export function useText<T>(catalog: TextCatalog<T>): T {
  return catalog[useLocaleStore(state => state.locale)];
}

/**
 * Copy for the current locale, read at call time — for toasts, error mapping and other code
 * that runs outside render. Not reactive: inside render, use `useText` instead.
 */
export function readText<T>(catalog: TextCatalog<T>): T {
  return catalog[useLocaleStore.getState().locale];
}
