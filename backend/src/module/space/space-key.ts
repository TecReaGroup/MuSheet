import type { Space } from '../../../../contract/api';
import type { SessionAccount } from '../auth/session-account';

/**
 * Scores and setlists store a space key: the owner's user id for a personal library, or
 * TEAM_SPACE_KEY for the shared one. User ids are 'root' or UUIDs, so they never collide with it.
 */
export const TEAM_SPACE_KEY = 'team';

/** The two libraries a caller can reach; anything outside them is reported as not found. */
export type VisibleSpaceKeys = readonly [personal: string, team: string];

export function visibleSpaceKeys(account: SessionAccount): VisibleSpaceKeys {
  return [account.id, TEAM_SPACE_KEY];
}

export function spaceKeyOf(account: SessionAccount, space: Space) {
  return space === 'team' ? TEAM_SPACE_KEY : account.id;
}

export function spaceOfKey(key: string): Space {
  return key === TEAM_SPACE_KEY ? 'team' : 'personal';
}
