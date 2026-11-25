import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

// Bluetooth page-turn pedals present themselves as keyboards; these cover the common factory presets.
export const DEFAULT_NEXT_PAGE_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];
export const DEFAULT_PREVIOUS_PAGE_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp'];

interface PreferenceState {
  theme: ThemePreference;
  /** Only takes effect when the screen is wide enough to fit two pages at full height. */
  twoPageView: boolean;
  tapZones: boolean;
  nightScore: boolean;
  nextPageKeys: string[];
  previousPageKeys: string[];
  update: (patch: Partial<Omit<PreferenceState, 'update'>>) => void;
}

export const usePreferenceStore = create<PreferenceState>()(persist(
  set => ({
    theme: 'system',
    twoPageView: true,
    tapZones: true,
    nightScore: false,
    nextPageKeys: DEFAULT_NEXT_PAGE_KEYS,
    previousPageKeys: DEFAULT_PREVIOUS_PAGE_KEYS,
    update: patch => set(patch),
  }),
  {
    name: 'musheet.preference',
    version: 2,
    // v1 stored the removed half-page turn mode under `pageTurn`.
    migrate: persisted => {
      const { pageTurn: _pageTurn, ...rest } = persisted as Record<string, unknown>;
      return rest as unknown as PreferenceState;
    },
  },
));
