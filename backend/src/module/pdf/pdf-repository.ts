import { rm } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import { and, eq, inArray, lt, notExists, sql } from 'drizzle-orm';
import type { PdfFileView } from '../../../../contract/api';
import { appConfig } from '../../config/app-config';
import { db, type DbExecutor } from '../../db/client';
import { part, pdfFile } from '../../db/schema';
import { HttpError, notFound } from '../../http/http-error';
import { moveIntoStorage, pdfFilePath, removeStoredPdfs, thumbnailFilePath } from '../../infrastructure/file-storage';
import { log } from '../../infrastructure/logger';
import { JPEG_SIGNATURE_BYTES, startsWithJpegSignature, writeUploadToTemp } from '../../infrastructure/upload-temp';

const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;
// The PDF spec tolerates leading garbage before the header, readers scan the first KB.
const PDF_HEADER_SCAN_BYTES = 1024;
const ORPHAN_GRACE_PERIOD = '1 day';

function toPdfFileView(row: typeof pdfFile.$inferSelect): PdfFileView {
  return { sha256: row.sha256, pageCount: row.pageCount, hasThumbnail: row.hasThumbnail };
}

export async function findPdf(sha256: string): Promise<PdfFileView> {
  const [row] = await db.select().from(pdfFile).where(eq(pdfFile.sha256, sha256));
  if (!row) throw notFound('PDF');
  return toPdfFileView(row);
}

export async function requirePdf(executor: DbExecutor, sha256: string) {
  const [row] = await executor.select({ sha256: pdfFile.sha256 }).from(pdfFile).where(eq(pdfFile.sha256, sha256));
  if (!row) throw new HttpError(400, 'pdf_missing', 'PDF has not been uploaded');
}

/**
 * Streams an uploaded PDF to storage. The URL hash is a client claim, so the server
 * re-hashes the bytes and rejects mismatches before the file becomes addressable.
 * The page count comes from the client's pdf.js parse; the server deliberately has no PDF parser.
 */
export async function storePdf(sha256: string, pageCount: number, body: Readable): Promise<PdfFileView> {
  const [existing] = await db.select().from(pdfFile).where(eq(pdfFile.sha256, sha256));
  if (existing) {
    body.resume();
    return toPdfFileView(existing);
  }

  const { tempPath, meter } = await writeUploadToTemp(body, appConfig.maxUploadBytes, PDF_HEADER_SCAN_BYTES);
  try {
    if (meter.digest() !== sha256) throw new HttpError(400, 'hash_mismatch', 'Uploaded bytes do not match the SHA-256');
    if (!meter.head().includes('%PDF-')) throw new HttpError(415, 'not_pdf', 'File is not a PDF');

    await moveIntoStorage(tempPath, pdfFilePath(sha256));
    const [row] = await db.insert(pdfFile)
      .values({ sha256, byteSize: meter.size(), pageCount })
      .onConflictDoUpdate({ target: pdfFile.sha256, set: { pageCount } })
      .returning();
    log('info', 'PDF', 'Stored PDF', { sha256: sha256.slice(0, 12), size: meter.size(), pageCount });
    return toPdfFileView(row!);
  } finally {
    await rm(tempPath, { force: true });
  }
}

export async function storeThumbnail(sha256: string, body: Readable) {
  await findPdf(sha256);
  const { tempPath, meter } = await writeUploadToTemp(body, MAX_THUMBNAIL_BYTES, JPEG_SIGNATURE_BYTES);
  try {
    if (!startsWithJpegSignature(meter.head())) throw new HttpError(415, 'not_jpeg', 'Thumbnail must be a JPEG');
    await moveIntoStorage(tempPath, thumbnailFilePath(sha256));
    await db.update(pdfFile).set({ hasThumbnail: true }).where(eq(pdfFile.sha256, sha256));
  } finally {
    await rm(tempPath, { force: true });
  }
}

function unreferenced() {
  return notExists(db.select({ one: sql`1` }).from(part).where(eq(part.pdfSha256, pdfFile.sha256)));
}

/**
 * Runs `work` in a transaction; PDFs it reports via `releasePdfs` are deleted when no part
 * references them anymore. Files are unlinked only after commit so a rollback never loses a PDF.
 */
export async function withPdfRelease<T>(
  work: (transaction: DbExecutor, releasePdfs: (sha256List: string[]) => void) => Promise<T>,
): Promise<T> {
  const candidates = new Set<string>();
  let removed: string[] = [];
  const outcome = await db.transaction(async transaction => {
    const value = await work(transaction, list => list.forEach(sha256 => candidates.add(sha256)));
    if (candidates.size > 0) {
      const rows = await transaction.delete(pdfFile)
        .where(and(inArray(pdfFile.sha256, [...candidates]), unreferenced()))
        .returning({ sha256: pdfFile.sha256 });
      removed = rows.map(row => row.sha256);
    }
    return value;
  });
  await removeStoredPdfs(removed);
  return outcome;
}

/** Uploads whose import was abandoned leave unreferenced PDFs; a grace period protects imports in flight. */
export async function sweepOrphanPdfs() {
  const rows = await db.delete(pdfFile)
    .where(and(lt(pdfFile.createdAt, sql`now() - ${ORPHAN_GRACE_PERIOD}::interval`), unreferenced()))
    .returning({ sha256: pdfFile.sha256 });
  await removeStoredPdfs(rows.map(row => row.sha256));
  if (rows.length > 0) log('info', 'PDF', 'Removed orphan PDFs', { count: rows.length });
}
