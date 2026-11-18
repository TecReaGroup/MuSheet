import { openPdfUrl, pdfFileUrl, type PDFDocumentProxy } from '@/shared/lib/pdfjs';

const MAX_OPEN_DOCUMENTS = 3;

export interface PageSize {
  width: number;
  height: number;
}

export interface LoadedPdf {
  sha256: string;
  proxy: PDFDocumentProxy;
  /** Index 0 is page 1; read up front so layout never waits on a page render. */
  pageSizes: PageSize[];
}

const openDocuments = new Map<string, Promise<LoadedPdf>>();

async function openLoadedPdf(sha256: string): Promise<LoadedPdf> {
  const proxy = await openPdfUrl(pdfFileUrl(sha256));
  const pageSizes = await Promise.all(Array.from({ length: proxy.numPages }, async (_, index) => {
    const page = await proxy.getPage(index + 1);
    const { width, height } = page.getViewport({ scale: 1 });
    return { width, height };
  }));
  return { sha256, proxy, pageSizes };
}

/** Keeps the last few documents open so moving between songs in a setlist is instant. */
export function loadPdf(sha256: string): Promise<LoadedPdf> {
  const cached = openDocuments.get(sha256);
  if (cached) {
    openDocuments.delete(sha256);
    openDocuments.set(sha256, cached);
    return cached;
  }

  const loading = openLoadedPdf(sha256);
  openDocuments.set(sha256, loading);
  loading.catch(() => openDocuments.delete(sha256));

  while (openDocuments.size > MAX_OPEN_DOCUMENTS) {
    const [oldestKey, oldest] = openDocuments.entries().next().value!;
    openDocuments.delete(oldestKey);
    oldest.then(pdf => pdf.proxy.destroy()).catch(() => undefined);
  }
  return loading;
}
