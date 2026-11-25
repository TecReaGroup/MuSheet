import type { ListQuery, ScoreSummary, SetlistSummary } from '@contract/api';
import { useScoreList } from '@/entity/score/score-api';
import { useSetlistList } from '@/entity/setlist/setlist-api';

type SpaceQuery = Omit<ListQuery, 'space'>;

interface MergedList<T> {
  items: T[];
  personalCount: number;
  teamCount: number;
  isPending: boolean;
}

interface Listed {
  lastOpenedAt: string | null;
  createdAt: string;
}

/** "Recently opened" across libraries: opened items newest first, never-opened ones after, newest created first. */
export function byRecentlyOpened(left: Listed, right: Listed) {
  if (left.lastOpenedAt !== right.lastOpenedAt) {
    if (!left.lastOpenedAt) return 1;
    if (!right.lastOpenedAt) return -1;
    return right.lastOpenedAt.localeCompare(left.lastOpenedAt);
  }
  return right.createdAt.localeCompare(left.createdAt);
}

function merge<T>(personal: T[] | undefined, team: T[] | undefined, compare: (left: T, right: T) => number, limit: number | undefined): Omit<MergedList<T>, 'isPending'> {
  const merged = [...(personal ?? []), ...(team ?? [])].sort(compare);
  return { items: limit ? merged.slice(0, limit) : merged, personalCount: personal?.length ?? 0, teamCount: team?.length ?? 0 };
}

/**
 * Runs the same list query against the personal and team libraries and merges the results.
 * Each library is asked for `limit` items, so the merged top-N is exact.
 */
export function useScoresFromBothSpaces(query: SpaceQuery, compare: (left: ScoreSummary, right: ScoreSummary) => number): MergedList<ScoreSummary> {
  const personal = useScoreList({ ...query, space: 'personal' });
  const team = useScoreList({ ...query, space: 'team' });
  return { ...merge(personal.data, team.data, compare, query.limit), isPending: personal.isPending || team.isPending };
}

export function useSetlistsFromBothSpaces(query: SpaceQuery, compare: (left: SetlistSummary, right: SetlistSummary) => number): MergedList<SetlistSummary> {
  const personal = useSetlistList({ ...query, space: 'personal' });
  const team = useSetlistList({ ...query, space: 'team' });
  return { ...merge(personal.data, team.data, compare, query.limit), isPending: personal.isPending || team.isPending };
}
