import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = workerUrl;

// Copied from node_modules by vite-plugin-static-copy; see vite.config.ts.
const PDFJS_ASSET_BASE = `${import.meta.env.BASE_URL}pdfjs/`;

const DOCUMENT_OPTIONS = {
  cMapUrl: `${PDFJS_ASSET_BASE}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${PDFJS_ASSET_BASE}standard_fonts/`,
  wasmUrl: `${PDFJS_ASSET_BASE}wasm/`,
};

export function pdfFileUrl(sha256: string) {
  return `/file/pdf/${sha256}.pdf`;
}

export function thumbnailUrl(sha256: string) {
  return `/file/thumbnail/${sha256}.jpg`;
}

export function openPdfUrl(url: string): Promise<PDFDocumentProxy> {
  return getDocument({ url, ...DOCUMENT_OPTIONS }).promise;
}

/** pdf.js transfers (detaches) the buffer to its worker; pass a copy if the bytes are needed afterwards. */
export function openPdfBytes(data: Uint8Array): Promise<PDFDocumentProxy> {
  return getDocument({ data, ...DOCUMENT_OPTIONS }).promise;
}

/** Renders one page onto a fresh white canvas at the given pixel width. */
export async function renderPageToCanvas(document: PDFDocumentProxy, pageNumber: number, pixelWidth: number) {
  const page = await document.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: pixelWidth / baseViewport.width });
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext('2d', { alpha: false })!;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  page.cleanup();
  return canvas;
}
