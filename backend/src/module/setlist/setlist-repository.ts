import { asc, eq, ilike, or, sql } from 'drizzle-orm';
import type { z } from 'zod';
import type {
  listQuerySchema,
  setlistCreateRequestSchema,
  SetlistDetail,
  SetlistSummary,
  setlistUpdateRequestSchema,
} from '../../../../contract/api';
import { db, type DbExecutor } from '../../db/client';
import { containsPattern, listOrdering } from '../../db/list-query';
import { score, setlist, setlistItem } from '../../db/schema';
import { HttpError, notFound } from '../../http/http-error';
import { toScoreSummaries } from '../score/score-view';

type ListQuery = z.output<typeof listQuerySchema>;
type SetlistCreate = z.output<typeof setlistCreateRequestSchema>;
type SetlistUpdate = z.output<typeof setlistUpdateRequestSchema>;

const summaryColumns = {
  id: setlist.id,
  name: setlist.name,
  description: setlist.description,
  createdAt: setlist.createdAt,
  lastOpenedAt: setlist.lastOpenedAt,
  scoreCount: sql<number>`(select count(*)::int from ${setlistItem} where ${setlistItem.setlistId} = ${setlist.id})`,
};

interface SummaryRow {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  lastOpenedAt: Date | null;
  scoreCount: number;
}

function toSetlistSummary(row: SummaryRow): SetlistSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    lastOpenedAt: row.lastOpenedAt?.toISOString() ?? null,
    scoreCount: row.scoreCount,
  };
}

async function loadSetlistSummary(executor: DbExecutor, setlistId: string) {
  const [row] = await executor.select(summaryColumns).from(setlist).where(eq(setlist.id, setlistId));
  if (!row) throw notFound('Setlist');
  return toSetlistSummary(row);
}

export async function listSetlists(query: ListQuery): Promise<SetlistSummary[]> {
  const pattern = query.query ? containsPattern(query.query) : undefined;
  const rows = await db.select(summaryColumns).from(setlist)
    .where(pattern ? or(ilike(setlist.name, pattern), ilike(setlist.description, pattern)) : undefined)
    .orderBy(...listOrdering({ created: setlist.createdAt, title: setlist.name, opened: setlist.lastOpenedAt }, query.sort, query.order))
    .limit(query.limit);
  return rows.map(toSetlistSummary);
}

export async function getSetlistDetail(setlistId: string): Promise<SetlistDetail> {
  const summary = await loadSetlistSummary(db, setlistId);
  const scoreRows = await db.select({ score })
    .from(setlistItem)
    .innerJoin(score, eq(score.id, setlistItem.scoreId))
    .where(eq(setlistItem.setlistId, setlistId))
    .orderBy(asc(setlistItem.position));
  return { ...summary, scores: await toScoreSummaries(db, scoreRows.map(row => row.score)) };
}

export async function createSetlist(request: SetlistCreate): Promise<SetlistSummary> {
  const [row] = await db.insert(setlist).values(request).returning({ id: setlist.id });
  return loadSetlistSummary(db, row!.id);
}

export async function updateSetlist(setlistId: string, patch: SetlistUpdate): Promise<SetlistSummary> {
  const rows = await db.update(setlist).set({ ...patch, updatedAt: new Date() }).where(eq(setlist.id, setlistId)).returning({ id: setlist.id });
  if (rows.length === 0) throw notFound('Setlist');
  return loadSetlistSummary(db, setlistId);
}

export async function deleteSetlist(setlistId: string) {
  const rows = await db.delete(setlist).where(eq(setlist.id, setlistId)).returning({ id: setlist.id });
  if (rows.length === 0) throw notFound('Setlist');
}

export async function markSetlistOpened(setlistId: string) {
  const rows = await db.update(setlist).set({ lastOpenedAt: new Date() }).where(eq(setlist.id, setlistId)).returning({ id: setlist.id });
  if (rows.length === 0) throw notFound('Setlist');
}

/** Replaces the whole ordered list in one step, so reorder, add and remove share one code path. */
export async function replaceSetlistItems(setlistId: string, scoreIds: string[]) {
  if (new Set(scoreIds).size !== scoreIds.length) throw new HttpError(400, 'duplicate_score', 'A score can appear once per setlist');
  await db.transaction(async transaction => {
    await loadSetlistSummary(transaction, setlistId);
    await transaction.delete(setlistItem).where(eq(setlistItem.setlistId, setlistId));
    if (scoreIds.length > 0) {
      await transaction.insert(setlistItem).values(scoreIds.map((scoreId, position) => ({ setlistId, scoreId, position })));
    }
    await transaction.update(setlist).set({ updatedAt: new Date() }).where(eq(setlist.id, setlistId));
  });
}

export async function appendSetlistItem(setlistId: string, scoreId: string) {
  await db.transaction(async transaction => {
    await loadSetlistSummary(transaction, setlistId);
    const [{ nextPosition }] = await transaction
      .select({ nextPosition: sql<number>`coalesce(max(${setlistItem.position}), -1)::int + 1` })
      .from(setlistItem)
      .where(eq(setlistItem.setlistId, setlistId));
    await transaction.insert(setlistItem).values({ setlistId, scoreId, position: nextPosition }).onConflictDoNothing();
    await transaction.update(setlist).set({ updatedAt: new Date() }).where(eq(setlist.id, setlistId));
  });
}
