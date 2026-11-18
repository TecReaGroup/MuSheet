import type { ScoreSummary } from '@contract/api';

/** Where tapping a score goes: straight into the viewer when it has a part, else to its detail page to add one. */
export function scoreOpenPath(score: ScoreSummary) {
  const firstPart = score.parts[0];
  return firstPart ? `/view/${firstPart.id}` : `/score/${score.id}`;
}
