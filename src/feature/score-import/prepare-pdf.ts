import type { PdfFileView } from '@contract/api';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';
import { ApiError, requestJson, uploadBlob } from '@/shared/api/http-client';
import { log, serializeError } from '@/shared/lib/logger';
import { openPdfBytes, renderPageToCanvas, type PDFDocumentProxy } from '@/shared/lib/pdfjs';

const THUMBNAIL_WIDTH = 360;
const THUMBNAIL_JPEG_QUALITY = 0.82;

export class PdfReadError extends Error {
  constructor(cause: unknown) {
    super('Cannot read PDF', { cause });
    this.name = 'PdfReadError';
  }
}

export interface PreparedPdf {
  sha256: string;
  pageCount: number;
}

async function findUploadedPdf(hash: string): Promise<PdfFileView | null> {
  try {
    return await requestJson<PdfFileView>('GET', `/api/pdf/${hash}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

async function renderThumbnail(document: PDFDocumentProxy): Promise<Blob | null> {
  const canvas = await renderPageToCanvas(document, 1, THUMBNAIL_WIDTH);
  // JPEG rather than WebP: Safari cannot encode WebP from a canvas.
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', THUMBNAIL_JPEG_QUALITY));
}

async function inspectPdf(bytes: Uint8Array) {
  let document: PDFDocumentProxy;
  try {
    document = await openPdfBytes(bytes);
  } catch (error) {
    throw new PdfReadError(error);
  }
  try {
    return { pageCount: document.numPages, thumbnail: await renderThumbnail(document) };
  } finally {
    await document.destroy();
  }
}

/**
 * Hashes, inspects and uploads a PDF so it can be attached to a score.
 * Identical files are detected by SHA-256 and never uploaded twice.
 */
export async function preparePdf(file: File): Promise<PreparedPdf> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Pure-JS hash: crypto.subtle is missing outside secure contexts, e.g. a tablet on http://<LAN IP>.
  const hash = bytesToHex(sha256(bytes));

  const existing = await findUploadedPdf(hash);
  if (existing) return { sha256: hash, pageCount: existing.pageCount };

  const { pageCount, thumbnail } = await inspectPdf(bytes);
  await uploadBlob(`/api/pdf/${hash}?pageCount=${pageCount}`, file, 'application/pdf');
  if (thumbnail) {
    await uploadBlob(`/api/pdf/${hash}/thumbnail`, thumbnail, 'image/jpeg').catch(error => {
      log('warn', 'Import', 'Thumbnail upload failed', serializeError(error));
    });
  }
  log('info', 'Import', 'PDF uploaded', { pageCount, size: file.size });
  return { sha256: hash, pageCount };
}

export function titleFromFileName(fileName: string) {
  return fileName.replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').trim() || fileName;
}

export function isPdfFile(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}
