import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';
/** "half" swaps the top half to the next page first, so the reader's eyes never hit a blank turn. */
export type PageTurnMode = 'page' | 'half';

// Bluetooth page-turn pedals present themselves as keyboards; these cover the common factory presets.
export const DEFAULT_NEXT_PAGE_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];
export const DEFAULT_PREVIOUS_PAGE_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp'];

interface PreferenceState {
  theme: ThemePreference;
  pageTurn: PageTurnMode;
  tapZones: boolean;
  nightScore: boolean;
  showAnnotation: boolean;
  nextPageKeys: string[];
  previousPageKeys: string[];
  update: (patch: Partial<Omit<PreferenceState, 'update'>>) => void;
}

export const usePreferenceStore = create<PreferenceState>()(persist(
  set => ({
    theme: 'system',
    pageTurn: 'page',
    tapZones: true,
    nightScore: false,
    showAnnotation: true,
    nextPageKeys: DEFAULT_NEXT_PAGE_KEYS,
    previousPageKeys: DEFAULT_PREVIOUS_PAGE_KEYS,
    update: patch => set(patch),
  }),
  { name: 'musheet.preference', version: 1 },
));

export function describeKey(key: string) {
  if (key === ' ') return 'Space';
  return key.replace(/^Arrow/, '方向 ');
}
