import { and, eq, inArray } from 'drizzle-orm';
import type { DbExecutor } from '../../db/client';
import { part, score } from '../../db/schema';
import { notFound } from '../../http/http-error';
import type { VisibleSpaceKeys } from '../space/space-key';

/** Matches the score only when it lives in one of the caller's spaces; anything else reads as missing. */
export function visibleScore(scoreId: string, spaces: VisibleSpaceKeys) {
  return and(eq(score.id, scoreId), inArray(score.spaceKey, [...spaces]));
}

/** Resolves the score's space or 404s; every score-scoped operation goes through this one check. */
export async function requireScoreSpace(executor: DbExecutor, scoreId: string, spaces: VisibleSpaceKeys): Promise<string> {
  const [row] = await executor.select({ spaceKey: score.spaceKey }).from(score).where(visibleScore(scoreId, spaces));
  if (!row) throw notFound('Score');
  return row.spaceKey;
}

/** Parts inherit their score's space; returns the owning score id or 404s. */
export async function requireVisiblePart(executor: DbExecutor, partId: string, spaces: VisibleSpaceKeys): Promise<string> {
  const [row] = await executor.select({ scoreId: part.scoreId })
    .from(part)
    .innerJoin(score, eq(score.id, part.scoreId))
    .where(and(eq(part.id, partId), inArray(score.spaceKey, [...spaces])));
  if (!row) throw notFound('Part');
  return row.scoreId;
}
