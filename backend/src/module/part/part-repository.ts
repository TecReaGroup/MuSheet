import { and, eq, sql } from 'drizzle-orm';
import type { ViewerPart } from '../../../../contract/api';
import { db, type DbExecutor } from '../../db/client';
import { part, score } from '../../db/schema';
import { HttpError } from '../../http/http-error';
import { requirePdf, withPdfRelease } from '../pdf/pdf-repository';
import { requireScoreSpace, requireVisiblePart } from '../score/score-access';
import { loadScoreSummary } from '../score/score-view';
import type { VisibleSpaceKeys } from '../space/space-key';

export interface PartSelection {
  tag: string;
  pdfSha256: string;
}

/** Appends a part at the end of the score. */
export async function insertPart(executor: DbExecutor, scoreId: string, selection: PartSelection): Promise<string> {
  await requirePdf(executor, selection.pdfSha256);
  const [{ nextPosition }] = await executor
    .select({ nextPosition: sql<number>`coalesce(max(${part.position}), -1)::int + 1` })
    .from(part)
    .where(eq(part.scoreId, scoreId));
  const [row] = await executor.insert(part)
    .values({ scoreId, position: nextPosition, tag: selection.tag, pdfSha256: selection.pdfSha256 })
    .returning({ id: part.id });
  return row!.id;
}

export async function addPart(scoreId: string, spaces: VisibleSpaceKeys, selection: PartSelection) {
  return db.transaction(async transaction => {
    await requireScoreSpace(transaction, scoreId, spaces);
    const partId = await insertPart(transaction, scoreId, selection);
    await transaction.update(score).set({ updatedAt: new Date() }).where(eq(score.id, scoreId));
    return { partId, score: (await loadScoreSummary(transaction, scoreId))! };
  });
}

export async function reorderParts(scoreId: string, spaces: VisibleSpaceKeys, partIds: string[]) {
  await db.transaction(async transaction => {
    await requireScoreSpace(transaction, scoreId, spaces);
    const rows = await transaction.select({ id: part.id }).from(part).where(eq(part.scoreId, scoreId));
    const existing = new Set(rows.map(row => row.id));
    const isPermutation = partIds.length === existing.size && new Set(partIds).size === partIds.length
      && partIds.every(id => existing.has(id));
    if (!isPermutation) throw new HttpError(400, 'invalid_order', 'Part ids must be a permutation of the score parts');
    for (const [position, id] of partIds.entries()) {
      await transaction.update(part).set({ position }).where(and(eq(part.id, id), eq(part.scoreId, scoreId)));
    }
  });
}

export async function deletePart(partId: string, spaces: VisibleSpaceKeys) {
  await withPdfRelease(async (transaction, releasePdfs) => {
    await requireVisiblePart(transaction, partId, spaces);
    const [row] = await transaction.delete(part).where(eq(part.id, partId)).returning({ sha256: part.pdfSha256 });
    releasePdfs([row!.sha256]);
  });
}

export async function getViewerPart(partId: string, spaces: VisibleSpaceKeys): Promise<ViewerPart> {
  const scoreId = await requireVisiblePart(db, partId, spaces);
  return { partId, score: (await loadScoreSummary(db, scoreId))! };
}
