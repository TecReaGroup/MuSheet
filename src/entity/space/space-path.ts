import type { Space } from '@contract/api';

const SPACE_ROOT_PATH: Record<Space, string> = { personal: '/library', team: '/team' };

export function scoreCollectionPath(space: Space) {
  return SPACE_ROOT_PATH[space];
}

export function setlistCollectionPath(space: Space) {
  return `${SPACE_ROOT_PATH[space]}?tab=setlist`;
}
