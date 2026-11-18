import { and, eq } from 'drizzle-orm';
import type { AnnotationBook, Stroke } from '../../../../contract/api';
import { db } from '../../db/client';
import { annotationPage, part, pdfFile } from '../../db/schema';
import { HttpError, notFound } from '../../http/http-error';

async function requirePageCount(partId: string) {
  const [row] = await db.select({ pageCount: pdfFile.pageCount })
    .from(part)
    .innerJoin(pdfFile, eq(part.pdfSha256, pdfFile.sha256))
    .where(eq(part.id, partId));
  if (!row) throw notFound('Part');
  return row.pageCount;
}

export async function getAnnotationBook(partId: string): Promise<AnnotationBook> {
  await requirePageCount(partId);
  const rows = await db.select({ pageNumber: annotationPage.pageNumber, strokes: annotationPage.strokes })
    .from(annotationPage)
    .where(eq(annotationPage.partId, partId));
  return { pages: Object.fromEntries(rows.map(row => [String(row.pageNumber), row.strokes])) };
}

/** Replaces one page's strokes; an empty list removes the row so blank pages cost nothing. */
export async function saveAnnotationPage(partId: string, pageNumber: number, strokes: Stroke[]) {
  const pageCount = await requirePageCount(partId);
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
