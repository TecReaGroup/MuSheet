import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { z } from 'zod';
import type {
  listQuerySchema,
  scoreImportRequestSchema,
  ScoreDetail,
  ScoreImportResponse,
  ScoreSummary,
  scoreUpdateRequestSchema,
} from '../../../../contract/api';
import { db, type DbExecutor } from '../../db/client';
import { containsPattern, listOrdering } from '../../db/list-query';
import { part, score, setlist, setlistItem } from '../../db/schema';
import { notFound } from '../../http/http-error';
import { insertPart } from '../part/part-repository';
import { withPdfRelease } from '../pdf/pdf-repository';
import { TEAM_SPACE_KEY, type VisibleSpaceKeys } from '../space/space-key';
import { requireScoreSpace, visibleScore } from './score-access';
import { loadScoreSummary, toScoreSummaries } from './score-view';

type ListQuery = z.output<typeof listQuerySchema>;
type ScoreImport = Omit<z.output<typeof scoreImportRequestSchema>, 'space'>;
type ScoreUpdate = z.output<typeof scoreUpdateRequestSchema>;

export async function listScores(spaceKey: string, query: ListQuery): Promise<ScoreSummary[]> {
  const pattern = query.query ? containsPattern(query.query) : undefined;
  const rows = await db.select().from(score)
    .where(and(
      eq(score.spaceKey, spaceKey),
      pattern ? or(ilike(score.title, pattern), ilike(score.composer, pattern)) : undefined,
    ))
    .orderBy(...listOrdering({ created: score.createdAt, title: score.title, opened: score.lastOpenedAt }, query.sort, query.order))
    .limit(query.limit);
  return toScoreSummaries(db, rows);
}

export async function getScoreDetail(scoreId: string, spaces: VisibleSpaceKeys): Promise<ScoreDetail> {
  await requireScoreSpace(db, scoreId, spaces);
  const summary = (await loadScoreSummary(db, scoreId))!;
  const setlists = await db.select({ id: setlist.id, name: setlist.name })
    .from(setlistItem)
    .innerJoin(setlist, eq(setlist.id, setlistItem.setlistId))
    .where(eq(setlistItem.scoreId, scoreId))
    .orderBy(asc(setlist.name));
  return { ...summary, setlists };
}

/** A PDF whose title and composer match a score in the same space (case-insensitive) joins it as a new part. */
export async function importScore(spaceKey: string, request: ScoreImport): Promise<ScoreImportResponse> {
  return db.transaction(async transaction => {
    const [existing] = await transaction.select({ id: score.id }).from(score)
      .where(and(
        eq(score.spaceKey, spaceKey),
        eq(sql`lower(${score.title})`, request.title.toLowerCase()),
        eq(sql`lower(${score.composer})`, request.composer.toLowerCase()),
      ))
      .limit(1);
    const scoreId = existing?.id ?? (await transaction.insert(score)
      .values({ spaceKey, title: request.title, composer: request.composer })
      .returning({ id: score.id }))[0]!.id;

    const partId = await insertPart(transaction, scoreId, request);
    if (existing) await transaction.update(score).set({ updatedAt: new Date() }).where(eq(score.id, scoreId));
    return {
      score: (await loadScoreSummary(transaction, scoreId))!,
      partId,
      joinedExistingScore: Boolean(existing),
    };
  });
}

type ScoreRow = typeof score.$inferSelect;

/**
 * Copies personal scores into the team library inside the caller's transaction and returns the
 * copies keyed by source id. Parts point at the same content-addressed PDFs; annotations stay
 * behind because personal markings are private.
 */
export async function copyScoresIntoTeam(transaction: DbExecutor, personalSpaceKey: string, scoreIds: string[]): Promise<Map<string, ScoreRow>> {
  const uniqueIds = [...new Set(scoreIds)];
  if (uniqueIds.length === 0) return new Map();
  const sources = await transaction.select().from(score)
    .where(and(inArray(score.id, uniqueIds), eq(score.spaceKey, personalSpaceKey)));
  if (sources.length !== uniqueIds.length) throw notFound('Score');

  const sourceParts = await transaction.select().from(part)
    .where(inArray(part.scoreId, uniqueIds))
    .orderBy(asc(part.position));
  const copies = new Map<string, ScoreRow>();
  for (const source of sources) {
    const [copy] = await transaction.insert(score).values({
      spaceKey: TEAM_SPACE_KEY,
      title: source.title,
      composer: source.composer,
      bpm: source.bpm,
      timeSignature: source.timeSignature,
    }).returning();
    const parts = sourceParts.filter(candidate => candidate.scoreId === source.id);
    if (parts.length > 0) {
      await transaction.insert(part).values(parts.map(({ name, pdfSha256, position }) => ({
        scoreId: copy!.id, name, pdfSha256, position,
      })));
    }
    copies.set(source.id, copy!);
  }
  return copies;
}

export async function copyScoresToTeam(personalSpaceKey: string, scoreIds: string[]): Promise<ScoreSummary[]> {
  return db.transaction(async transaction => {
    const copies = await copyScoresIntoTeam(transaction, personalSpaceKey, scoreIds);
    return toScoreSummaries(transaction, [...copies.values()]);
  });
}

export async function updateScore(scoreId: string, spaces: VisibleSpaceKeys, patch: ScoreUpdate): Promise<ScoreSummary> {
  const rows = await db.update(score).set({ ...patch, updatedAt: new Date() }).where(visibleScore(scoreId, spaces)).returning();
  if (rows.length === 0) throw notFound('Score');
  const [summary] = await toScoreSummaries(db, rows);
  return summary!;
}

export async function deleteScore(scoreId: string, spaces: VisibleSpaceKeys) {
  await withPdfRelease(async (transaction, releasePdfs) => {
    await requireScoreSpace(transaction, scoreId, spaces);
    const partRows = await transaction.select({ sha256: part.pdfSha256 }).from(part).where(eq(part.scoreId, scoreId));
    await transaction.delete(score).where(eq(score.id, scoreId));
    releasePdfs(partRows.map(row => row.sha256));
  });
}

export async function markScoreOpened(scoreId: string, spaces: VisibleSpaceKeys) {
  const rows = await db.update(score).set({ lastOpenedAt: new Date() }).where(visibleScore(scoreId, spaces)).returning({ id: score.id });
  if (rows.length === 0) throw notFound('Score');
}

/** Removes a whole personal library (used when its account is deleted), releasing PDFs nothing else uses. */
export async function deleteSpaceLibrary(spaceKey: string) {
  await withPdfRelease(async (transaction, releasePdfs) => {
    await transaction.delete(setlist).where(eq(setlist.spaceKey, spaceKey));
    const partRows = await transaction.select({ sha256: part.pdfSha256 })
      .from(part)
      .innerJoin(score, eq(score.id, part.scoreId))
      .where(eq(score.spaceKey, spaceKey));
    await transaction.delete(score).where(eq(score.spaceKey, spaceKey));
    releasePdfs(partRows.map(row => row.sha256));
  });
}
