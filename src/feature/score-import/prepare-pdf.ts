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

/** One score holds one PDF: the first PDF wins, otherwise all images merge, ordered naturally by name (page2 < page10). */
export function pickImportSource(files: File[]): ImportSource | undefined {
  const pdf = files.find(isPdfFile);
  if (pdf) return { kind: 'pdf', file: pdf };
  const images = files.filter(isImageFile).sort((a, b) => compareFileNames(a.name, b.name));
  return images.length > 0 ? { kind: 'images', images } : undefined;
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
export async function preparePdf(source: ImportSource): Promise<PdfFileView> {
  const pdf = await toPdfBlob(source);
  const bytes = new Uint8Array(await pdf.arrayBuffer());
  // Pure-JS hash: crypto.subtle is missing outside secure contexts, e.g. a tablet on http://<LAN IP>.
  const hash = bytesToHex(sha256(bytes));

  const existing = await findUploadedPdf(hash);
  if (existing) return existing;

  const { pageCount, thumbnail } = await inspectPdf(bytes);
  await uploadBlob(`/api/pdf/${hash}?pageCount=${pageCount}`, pdf, 'application/pdf');
  const hasThumbnail = thumbnail !== null && await uploadBlob(`/api/pdf/${hash}/thumbnail`, thumbnail, 'image/jpeg').then(
    () => true,
    error => {
      log('warn', 'Import', 'Thumbnail upload failed', serializeError(error));
      return false;
    },
  );
  log('info', 'Import', 'PDF uploaded', { pageCount, size: pdf.size, source: source.kind });
  return { sha256: hash, pageCount, hasThumbnail };
}

export function titleFromImportSource(source: ImportSource) {
  const fileName = source.kind === 'pdf' ? source.file.name : source.images[0]!.name;
  return fileName.replace(PDF_EXTENSION_PATTERN, '').replace(IMAGE_EXTENSION_PATTERN, '').replace(/[_]+/g, ' ').trim() || fileName;
}
