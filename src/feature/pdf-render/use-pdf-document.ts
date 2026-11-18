import { useEffect, useState } from 'react';
import { log, serializeError } from '@/shared/lib/logger';
import { loadPdf, type LoadedPdf } from './pdf-document-cache';

type PdfDocumentState =
  | { status: 'loading' }
  | { status: 'ready'; pdf: LoadedPdf }
  | { status: 'failed' };

export function usePdfDocument(sha256: string): PdfDocumentState {
  const [state, setState] = useState<PdfDocumentState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadPdf(sha256)
      .then(pdf => !cancelled && setState({ status: 'ready', pdf }))
      .catch(error => {
        log('error', 'PdfRender', 'Opening PDF failed', { sha256: sha256.slice(0, 12), ...serializeError(error) });
        if (!cancelled) setState({ status: 'failed' });
      });
    return () => { cancelled = true; };
  }, [sha256]);

  return state;
}
