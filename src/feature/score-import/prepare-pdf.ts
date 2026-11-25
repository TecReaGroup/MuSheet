import type { PdfFileView } from '@contract/api';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';
import { ApiError, requestJson, uploadBlob } from '@/shared/api/http-client';
import { log, serializeError } from '@/shared/lib/logger';
import { openPdfBytes, renderPageToCanvas, type PDFDocumentProxy } from '@/shared/lib/pdfjs';
import { convertImagesToPdf } from './image-to-pdf';

const THUMBNAIL_WIDTH = 360;
const THUMBNAIL_JPEG_QUALITY = 0.82;

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i;
const PDF_EXTENSION_PATTERN = /\.pdf$/i;

export const IMPORTABLE_FILE_ACCEPT = 'application/pdf,.pdf,image/*';

export class UnreadableFileError extends Error {
  constructor(cause: unknown) {
    super('Cannot read file', { cause });
    this.name = 'UnreadableFileError';
  }
}

/** One PDF file, or all images picked together, merged into one PDF in file-name order. */
export type ImportSource =
  | { kind: 'pdf'; file: File }
  | { kind: 'images'; images: File[] };

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
    throw new UnreadableFileError(error);
  }
  try {
    return { pageCount: document.numPages, thumbnail: await renderThumbnail(document) };
  } finally {
    await document.destroy();
  }
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || PDF_EXTENSION_PATTERN.test(file.name);
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || IMAGE_EXTENSION_PATTERN.test(file.name);
}

export function isImportableFile(file: File) {
  return isPdfFile(file) || isImageFile(file);
}

const compareFileNames = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;

/** Each PDF stays its own source; all images merge into one source, ordered naturally by name (page2 < page10). */
export function groupImportSources(files: File[]): ImportSource[] {
  const pdfSources = files.filter(isPdfFile).map((file): ImportSource => ({ kind: 'pdf', file }));
  const images = files.filter(file => !isPdfFile(file) && isImageFile(file)).sort((a, b) => compareFileNames(a.name, b.name));
  return images.length > 0 ? [...pdfSources, { kind: 'images', images }] : pdfSources;
}

export function importSourceName(source: ImportSource) {
  if (source.kind === 'pdf') return source.file.name;
  const first = source.images[0]!.name;
  const last = source.images.at(-1)!.name;
  return source.images.length === 1 ? first : `${first} … ${last}`;
}

async function toPdfBlob(source: ImportSource): Promise<Blob> {
  if (source.kind === 'pdf') return source.file;
  try {
    return await convertImagesToPdf(source.images);
  } catch (error) {
    throw new UnreadableFileError(error);
  }
}

/**
 * Hashes, inspects and uploads a PDF (images are converted first) so it can be attached to a score.
 * Identical files are detected by SHA-256 and never uploaded twice.
 */
export async function preparePdf(source: ImportSource): Promise<PreparedPdf> {
  const pdf = await toPdfBlob(source);
  const bytes = new Uint8Array(await pdf.arrayBuffer());
  // Pure-JS hash: crypto.subtle is missing outside secure contexts, e.g. a tablet on http://<LAN IP>.
  const hash = bytesToHex(sha256(bytes));

  const existing = await findUploadedPdf(hash);
  if (existing) return { sha256: hash, pageCount: existing.pageCount };

  const { pageCount, thumbnail } = await inspectPdf(bytes);
  await uploadBlob(`/api/pdf/${hash}?pageCount=${pageCount}`, pdf, 'application/pdf');
  if (thumbnail) {
    await uploadBlob(`/api/pdf/${hash}/thumbnail`, thumbnail, 'image/jpeg').catch(error => {
      log('warn', 'Import', 'Thumbnail upload failed', serializeError(error));
    });
  }
  log('info', 'Import', 'PDF uploaded', { pageCount, size: pdf.size, source: source.kind });
  return { sha256: hash, pageCount };
}

export function titleFromImportSource(source: ImportSource) {
  const fileName = source.kind === 'pdf' ? source.file.name : source.images[0]!.name;
  return fileName.replace(PDF_EXTENSION_PATTERN, '').replace(IMAGE_EXTENSION_PATTERN, '').replace(/[_]+/g, ' ').trim() || fileName;
}
