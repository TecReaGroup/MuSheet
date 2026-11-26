import type { PdfFileView } from '@contract/api';
import { useRef, useState } from 'react';
import { describeError } from '@/shared/api/http-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { readText } from '@/shared/i18n/text';
import { log, serializeError } from '@/shared/lib/logger';
import { UnreadableFileError, pickImportSource, preparePdf, type ImportSource } from './prepare-pdf';

export type PdfUpload =
  | { state: 'idle' }
  | { state: 'preparing'; source: ImportSource }
  | { state: 'ready'; source: ImportSource; pdf: PdfFileView }
  | { state: 'failed'; message: string };

/** The one PDF a score or part is built from: picked, converted and uploaded in the background. */
export function usePdfUpload() {
  const [upload, setUpload] = useState<PdfUpload>({ state: 'idle' });
  // A newer pick or a reset makes any still-running preparation stale, so its outcome is dropped.
  const attemptRef = useRef(0);

  /** Starts preparing the picked files; returns the chosen source, or nothing when none is importable. */
  const selectFiles = (files: File[]): ImportSource | undefined => {
    const source = pickImportSource(files);
    if (!source) return undefined;
    const attempt = ++attemptRef.current;
    setUpload({ state: 'preparing', source });
    preparePdf(source)
      .then(pdf => {
        if (attempt === attemptRef.current) setUpload({ state: 'ready', source, pdf });
      })
      .catch(error => {
        log('warn', 'Import', 'Preparing PDF failed', serializeError(error));
        if (attempt !== attemptRef.current) return;
        setUpload({ state: 'failed', message: error instanceof UnreadableFileError ? readText(COMMON_TEXT).unreadableFile : describeError(error) });
      });
    return source;
  };

  const reset = () => {
    attemptRef.current += 1;
    setUpload({ state: 'idle' });
  };

  return { upload, selectFiles, reset };
}
