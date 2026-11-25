import type { PartView, ScoreSummary } from '@contract/api';

export type StartPage = number | 'last';

/** Keeps the musician on their own tag when moving to the next song, if that song has it. */
export function preferredPart(score: ScoreSummary, currentPart?: Pick<PartView, 'tag'>) {
  return (currentPart && score.parts.find(part => part.tag === currentPart.tag)) ?? score.parts[0];
}

export function viewerPath(partId: string, setlist?: { id: string; index: number }, startPage?: StartPage) {
  const params = new URLSearchParams();
  if (setlist) {
    params.set('setlist', setlist.id);
    params.set('index', String(setlist.index));
  }
  if (startPage !== undefined) params.set('page', String(startPage));
  const query = params.toString();
  return query ? `/view/${partId}?${query}` : `/view/${partId}`;
}

/** Finds the next song in `direction` that actually has a part to show. */
export function findPlayableIndex(scores: ScoreSummary[], fromIndex: number, direction: 1 | -1) {
  for (let index = fromIndex + direction; index >= 0 && index < scores.length; index += direction) {
    if (scores[index]!.parts.length > 0) return index;
  }
  return -1;
}
