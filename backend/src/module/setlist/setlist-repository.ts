import { and, asc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
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
import { copyScoresIntoTeam } from '../score/score-repository';
import { toScoreSummaries } from '../score/score-view';
import { spaceOfKey, TEAM_SPACE_KEY, type VisibleSpaceKeys } from '../space/space-key';

type ListQuery = z.output<typeof listQuerySchema>;
type SetlistCreate = Omit<z.output<typeof setlistCreateRequestSchema>, 'space'>;
type SetlistUpdate = z.output<typeof setlistUpdateRequestSchema>;

const summaryColumns = {
  id: setlist.id,
  spaceKey: setlist.spaceKey,
  name: setlist.name,
  description: setlist.description,
  createdAt: setlist.createdAt,
  lastOpenedAt: setlist.lastOpenedAt,
  scoreCount: sql<number>`(select count(*)::int from ${setlistItem} where ${setlistItem.setlistId} = ${setlist.id})`,
};

interface SummaryRow {
  id: string;
  spaceKey: string;
  name: string;
  description: string;
  createdAt: Date;
  lastOpenedAt: Date | null;
  scoreCount: number;
}

function toSetlistSummary(row: SummaryRow): SetlistSummary {
  return {
    id: row.id,
    space: spaceOfKey(row.spaceKey),
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    lastOpenedAt: row.lastOpenedAt?.toISOString() ?? null,
    scoreCount: row.scoreCount,
  };
}

function visibleSetlist(setlistId: string, spaces: VisibleSpaceKeys) {
  return and(eq(setlist.id, setlistId), inArray(setlist.spaceKey, [...spaces]));
}

async function loadSetlistRow(executor: DbExecutor, condition: SQL | undefined) {
  const [row] = await executor.select(summaryColumns).from(setlist).where(condition);
  if (!row) throw notFound('Setlist');
  return row;
}

/** A setlist may only hold scores from its own space, so a team setlist never exposes someone's private score. */
async function assertScoresInSpace(executor: DbExecutor, spaceKey: string, scoreIds: string[]) {
  if (scoreIds.length === 0) return;
  const rows = await executor.select({ id: score.id }).from(score)
    .where(and(inArray(score.id, scoreIds), eq(score.spaceKey, spaceKey)));
  if (rows.length !== scoreIds.length) throw notFound('Score');
}

export async function listSetlists(spaceKey: string, query: ListQuery): Promise<SetlistSummary[]> {
  const pattern = query.query ? containsPattern(query.query) : undefined;
  const rows = await db.select(summaryColumns).from(setlist)
    .where(and(
      eq(setlist.spaceKey, spaceKey),
      pattern ? or(ilike(setlist.name, pattern), ilike(setlist.description, pattern)) : undefined,
    ))
    .orderBy(...listOrdering({ created: setlist.createdAt, title: setlist.name, opened: setlist.lastOpenedAt }, query.sort, query.order))
    .limit(query.limit);
  return rows.map(toSetlistSummary);
}

export async function getSetlistDetail(setlistId: string, spaces: VisibleSpaceKeys): Promise<SetlistDetail> {
  const summary = toSetlistSummary(await loadSetlistRow(db, visibleSetlist(setlistId, spaces)));
  const scoreRows = await db.select({ score })
    .from(setlistItem)
    .innerJoin(score, eq(score.id, setlistItem.scoreId))
    .where(eq(setlistItem.setlistId, setlistId))
    .orderBy(asc(setlistItem.position));
  return { ...summary, scores: await toScoreSummaries(db, scoreRows.map(row => row.score)) };
}

export async function createSetlist(spaceKey: string, request: SetlistCreate): Promise<SetlistSummary> {
  const [row] = await db.insert(setlist).values({ spaceKey, ...request }).returning({ id: setlist.id });
  return toSetlistSummary(await loadSetlistRow(db, eq(setlist.id, row!.id)));
}

export async function updateSetlist(setlistId: string, spaces: VisibleSpaceKeys, patch: SetlistUpdate): Promise<SetlistSummary> {
  const rows = await db.update(setlist).set({ ...patch, updatedAt: new Date() }).where(visibleSetlist(setlistId, spaces)).returning({ id: setlist.id });
  if (rows.length === 0) throw notFound('Setlist');
  return toSetlistSummary(await loadSetlistRow(db, eq(setlist.id, setlistId)));
}

export async function deleteSetlist(setlistId: string, spaces: VisibleSpaceKeys) {
  const rows = await db.delete(setlist).where(visibleSetlist(setlistId, spaces)).returning({ id: setlist.id });
  if (rows.length === 0) throw notFound('Setlist');
}

export async function markSetlistOpened(setlistId: string, spaces: VisibleSpaceKeys) {
  const rows = await db.update(setlist).set({ lastOpenedAt: new Date() }).where(visibleSetlist(setlistId, spaces)).returning({ id: setlist.id });
  if (rows.length === 0) throw notFound('Setlist');
}

/** Replaces the whole ordered list in one step, so reorder, add and remove share one code path. */
export async function replaceSetlistItems(setlistId: string, spaces: VisibleSpaceKeys, scoreIds: string[]) {
  if (new Set(scoreIds).size !== scoreIds.length) throw new HttpError(400, 'duplicate_score', 'A score can appear once per setlist');
  await db.transaction(async transaction => {
    const { spaceKey } = await loadSetlistRow(transaction, visibleSetlist(setlistId, spaces));
    await assertScoresInSpace(transaction, spaceKey, scoreIds);
    await transaction.delete(setlistItem).where(eq(setlistItem.setlistId, setlistId));
    if (scoreIds.length > 0) {
      await transaction.insert(setlistItem).values(scoreIds.map((scoreId, position) => ({ setlistId, scoreId, position })));
    }
    await transaction.update(setlist).set({ updatedAt: new Date() }).where(eq(setlist.id, setlistId));
  });
}

export async function appendSetlistItem(setlistId: string, spaces: VisibleSpaceKeys, scoreId: string) {
  await db.transaction(async transaction => {
    const { spaceKey } = await loadSetlistRow(transaction, visibleSetlist(setlistId, spaces));
    await assertScoresInSpace(transaction, spaceKey, [scoreId]);
    const [{ nextPosition }] = await transaction
      .select({ nextPosition: sql<number>`coalesce(max(${setlistItem.position}), -1)::int + 1` })
      .from(setlistItem)
      .where(eq(setlistItem.setlistId, setlistId));
    await transaction.insert(setlistItem).values({ setlistId, scoreId, position: nextPosition }).onConflictDoNothing();
    await transaction.update(setlist).set({ updatedAt: new Date() }).where(eq(setlist.id, setlistId));
  });
}

/** Copies personal setlists into Team; a team setlist may only hold team scores, so its scores are copied too. */
export async function copySetlistsToTeam(personalSpaceKey: string, setlistIds: string[]): Promise<SetlistSummary[]> {
  const copyIds = await db.transaction(async transaction => {
    const uniqueIds = [...new Set(setlistIds)];
    const sources = await transaction.select().from(setlist)
      .where(and(inArray(setlist.id, uniqueIds), eq(setlist.spaceKey, personalSpaceKey)));
    if (sources.length !== uniqueIds.length) throw notFound('Setlist');

    const items = await transaction.select().from(setlistItem)
      .where(inArray(setlistItem.setlistId, uniqueIds))
      .orderBy(asc(setlistItem.position));
    const scoreCopies = await copyScoresIntoTeam(transaction, personalSpaceKey, items.map(item => item.scoreId));

    const ids: string[] = [];
    for (const source of sources) {
      const [copy] = await transaction.insert(setlist)
        .values({ spaceKey: TEAM_SPACE_KEY, name: source.name, description: source.description })
        .returning({ id: setlist.id });
      const copiedItems = items
        .filter(item => item.setlistId === source.id)
        .map((item, position) => ({ setlistId: copy!.id, scoreId: scoreCopies.get(item.scoreId)!.id, position }));
      if (copiedItems.length > 0) await transaction.insert(setlistItem).values(copiedItems);
      ids.push(copy!.id);
    }
    return ids;
  });
  const rows = await db.select(summaryColumns).from(setlist).where(inArray(setlist.id, copyIds));
  return rows.map(toSetlistSummary);
}
