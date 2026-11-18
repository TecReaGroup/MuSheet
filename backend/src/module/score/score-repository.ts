import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import type { z } from 'zod';
import type {
  listQuerySchema,
  scoreImportRequestSchema,
  ScoreDetail,
  ScoreImportResponse,
  ScoreSummary,
  scoreUpdateRequestSchema,
} from '../../../../contract/api';
import { db } from '../../db/client';
import { containsPattern, listOrdering } from '../../db/list-query';
import { part, score, setlist, setlistItem } from '../../db/schema';
import { notFound } from '../../http/http-error';
import { insertPart } from '../part/part-repository';
import { withPdfRelease } from '../pdf/pdf-repository';
import { loadScoreSummary, toScoreSummaries } from './score-view';

type ListQuery = z.output<typeof listQuerySchema>;
type ScoreImport = z.output<typeof scoreImportRequestSchema>;
type ScoreUpdate = z.output<typeof scoreUpdateRequestSchema>;

export async function listScores(query: ListQuery): Promise<ScoreSummary[]> {
  const pattern = query.query ? containsPattern(query.query) : undefined;
  const rows = await db.select().from(score)
    .where(pattern ? or(ilike(score.title, pattern), ilike(score.composer, pattern)) : undefined)
    .orderBy(...listOrdering({ created: score.createdAt, title: score.title, opened: score.lastOpenedAt }, query.sort, query.order))
    .limit(query.limit);
  return toScoreSummaries(db, rows);
}

export async function getScoreDetail(scoreId: string): Promise<ScoreDetail> {
  const summary = await loadScoreSummary(db, scoreId);
  if (!summary) throw notFound('Score');
  const setlists = await db.select({ id: setlist.id, name: setlist.name })
    .from(setlistItem)
    .innerJoin(setlist, eq(setlist.id, setlistItem.setlistId))
    .where(eq(setlistItem.scoreId, scoreId))
    .orderBy(asc(setlist.name));
  return { ...summary, setlists };
}

/** A PDF whose title and composer match an existing score (case-insensitive) joins it as a new part. */
export async function importScore(request: ScoreImport): Promise<ScoreImportResponse> {
  return db.transaction(async transaction => {
    const [existing] = await transaction.select({ id: score.id }).from(score)
      .where(and(
        eq(sql`lower(${score.title})`, request.title.toLowerCase()),
        eq(sql`lower(${score.composer})`, request.composer.toLowerCase()),
      ))
      .limit(1);
    const scoreId = existing?.id ?? (await transaction.insert(score)
      .values({ title: request.title, composer: request.composer })
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

export async function updateScore(scoreId: string, patch: ScoreUpdate): Promise<ScoreSummary> {
  const rows = await db.update(score).set({ ...patch, updatedAt: new Date() }).where(eq(score.id, scoreId)).returning();
  if (rows.length === 0) throw notFound('Score');
  const [summary] = await toScoreSummaries(db, rows);
  return summary!;
}

export async function deleteScore(scoreId: string) {
  await withPdfRelease(async (transaction, releasePdfs) => {
    const partRows = await transaction.select({ sha256: part.pdfSha256 }).from(part).where(eq(part.scoreId, scoreId));
    const deleted = await transaction.delete(score).where(eq(score.id, scoreId)).returning({ id: score.id });
    if (deleted.length === 0) throw notFound('Score');
    releasePdfs(partRows.map(row => row.sha256));
  });
}

export async function markScoreOpened(scoreId: string) {
  const rows = await db.update(score).set({ lastOpenedAt: new Date() }).where(eq(score.id, scoreId)).returning({ id: score.id });
  if (rows.length === 0) throw notFound('Score');
}
