import type { Space } from '@contract/api';
import { useEffect } from 'react';
import { create } from 'zustand';

const useActiveSpaceStore = create<{ space: Space }>()(() => ({ space: 'personal' }));

/**
 * Pages declare which library their content belongs to (a team score's detail page is "team"
 * even though its URL is not under /team), so app-wide actions like dropping PDFs land there.
 * Pass undefined while the content is still loading.
 */
export function useDeclareActiveSpace(space: Space | undefined) {
  useEffect(() => {
    if (!space) return;
    useActiveSpaceStore.setState({ space });
    return () => useActiveSpaceStore.setState({ space: 'personal' });
  }, [space]);
}

export function readActiveSpace(): Space {
  return useActiveSpaceStore.getState().space;
}
