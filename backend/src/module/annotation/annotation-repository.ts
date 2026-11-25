import { and, eq, inArray } from 'drizzle-orm';
import type { AnnotationBook, Stroke } from '../../../../contract/api';
import { db } from '../../db/client';
import { annotationPage, part, pdfFile, score } from '../../db/schema';
import { HttpError, notFound } from '../../http/http-error';
import type { VisibleSpaceKeys } from '../space/space-key';

// Annotations hang off parts, so a team score's markings are shared and a personal score's stay private.
async function requirePageCount(partId: string, spaces: VisibleSpaceKeys) {
  const [row] = await db.select({ pageCount: pdfFile.pageCount })
    .from(part)
    .innerJoin(pdfFile, eq(part.pdfSha256, pdfFile.sha256))
    .innerJoin(score, eq(score.id, part.scoreId))
    .where(and(eq(part.id, partId), inArray(score.spaceKey, [...spaces])));
  if (!row) throw notFound('Part');
  return row.pageCount;
}

export async function getAnnotationBook(partId: string, spaces: VisibleSpaceKeys): Promise<AnnotationBook> {
  await requirePageCount(partId, spaces);
  const rows = await db.select({ pageNumber: annotationPage.pageNumber, strokes: annotationPage.strokes })
    .from(annotationPage)
    .where(eq(annotationPage.partId, partId));
  return { pages: Object.fromEntries(rows.map(row => [String(row.pageNumber), row.strokes])) };
}

/** Replaces one page's strokes; an empty list removes the row so blank pages cost nothing. */
export async function saveAnnotationPage(partId: string, spaces: VisibleSpaceKeys, pageNumber: number, strokes: Stroke[]) {
  const pageCount = await requirePageCount(partId, spaces);
  if (pageNumber > pageCount) throw new HttpError(400, 'page_out_of_range', `Part has ${pageCount} pages`);

  const pageKey = and(eq(annotationPage.partId, partId), eq(annotationPage.pageNumber, pageNumber));
  if (strokes.length === 0) {
    await db.delete(annotationPage).where(pageKey);
    return;
  }
  await db.insert(annotationPage)
    .values({ partId, pageNumber, strokes })
    .onConflictDoUpdate({
      target: [annotationPage.partId, annotationPage.pageNumber],
      set: { strokes, updatedAt: new Date() },
    });
}
