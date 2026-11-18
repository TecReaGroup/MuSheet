import type { SortKey, SortOrder } from '@contract/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SortState {
  sort: SortKey;
  order: SortOrder;
}

export type LibraryCollection = 'score' | 'setlist';

/** Re-selecting the active key flips direction; a new key starts A→Z for names and newest-first otherwise. */
export function nextSortState(current: SortState, sort: SortKey): SortState {
  if (current.sort === sort) return { sort, order: current.order === 'asc' ? 'desc' : 'asc' };
  return { sort, order: sort === 'title' ? 'asc' : 'desc' };
}

interface LibrarySortState {
  score: SortState;
  setlist: SortState;
  select: (collection: LibraryCollection, sort: SortKey) => void;
}

export const useLibrarySortStore = create<LibrarySortState>()(persist(
  set => ({
    score: { sort: 'created', order: 'desc' },
    setlist: { sort: 'created', order: 'desc' },
    select: (collection, sort) => set(state => {
      const next = nextSortState(state[collection], sort);
      return collection === 'score' ? { score: next } : { setlist: next };
    }),
  }),
  { name: 'musheet.library-sort', version: 1 },
));
