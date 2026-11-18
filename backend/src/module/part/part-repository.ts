import { and, eq, sql } from 'drizzle-orm';
import type { Instrument, ViewerPart } from '../../../../contract/api';
import { db, type DbExecutor } from '../../db/client';
import { postgresErrorCode, UNIQUE_VIOLATION } from '../../db/postgres-error';
import { part, score } from '../../db/schema';
import { HttpError, notFound } from '../../http/http-error';
import { requirePdf, withPdfRelease } from '../pdf/pdf-repository';
import { loadScoreSummary } from '../score/score-view';

export interface PartSelection {
  instrument: Instrument;
  customLabel: string | null;
  pdfSha256: string;
}

/** Appends a part at the end of the score; one score cannot hold the same instrument twice. */
export async function insertPart(executor: DbExecutor, scoreId: string, selection: PartSelection): Promise<string> {
  await requirePdf(executor, selection.pdfSha256);
  const [{ nextPosition }] = await executor
    .select({ nextPosition: sql<number>`coalesce(max(${part.position}), -1)::int + 1` })
    .from(part)
    .where(eq(part.scoreId, scoreId));
  try {
    const [row] = await executor.insert(part)
      .values({
        scoreId,
        position: nextPosition,
        instrument: selection.instrument,
        customLabel: selection.customLabel,
        pdfSha256: selection.pdfSha256,
      })
      .returning({ id: part.id });
    return row!.id;
  } catch (error) {
    if (postgresErrorCode(error) === UNIQUE_VIOLATION) {
      throw new HttpError(409, 'instrument_exists', 'This score already has a part for that instrument');
    }
    throw error;
  }
}

export async function addPart(scoreId: string, selection: PartSelection) {
  return db.transaction(async transaction => {
    const [owner] = await transaction.select({ id: score.id }).from(score).where(eq(score.id, scoreId));
    if (!owner) throw notFound('Score');
    const partId = await insertPart(transaction, scoreId, selection);
    await transaction.update(score).set({ updatedAt: new Date() }).where(eq(score.id, scoreId));
    return { partId, score: (await loadScoreSummary(transaction, scoreId))! };
  });
}

export async function reorderParts(scoreId: string, partIds: string[]) {
  await db.transaction(async transaction => {
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

export async function deletePart(partId: string) {
  await withPdfRelease(async (transaction, releasePdfs) => {
    const [row] = await transaction.delete(part).where(eq(part.id, partId)).returning({ sha256: part.pdfSha256 });
    if (!row) throw notFound('Part');
    releasePdfs([row.sha256]);
  });
}

export async function getViewerPart(partId: string): Promise<ViewerPart> {
  const [row] = await db.select({ scoreId: part.scoreId }).from(part).where(eq(part.id, partId));
  if (!row) throw notFound('Part');
  return { partId, score: (await loadScoreSummary(db, row.scoreId))! };
}
