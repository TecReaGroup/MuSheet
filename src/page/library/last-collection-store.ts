import type { Space } from '@contract/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LibraryCollection } from '@/feature/library-search/sort-store';

interface LastCollectionState {
  bySpace: Record<Space, LibraryCollection>;
  remember: (space: Space, collection: LibraryCollection) => void;
}

/** The tab each library was last left on, so a bare `/library` or `/team` link reopens it. */
export const useLastCollectionStore = create<LastCollectionState>()(persist(
  set => ({
    bySpace: { personal: 'score', team: 'score' },
    remember: (space, collection) => set(state => ({ bySpace: { ...state.bySpace, [space]: collection } })),
  }),
  { name: 'musheet.library-last-collection', version: 1 },
));
