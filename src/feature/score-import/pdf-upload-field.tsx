import { PartThumbnail } from '@/entity/part/part-thumbnail';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import { PdfDropZone } from './pdf-drop-zone';
import { importSourceName } from './prepare-pdf';
import type { PdfUpload } from './use-pdf-upload';

const UPLOAD_FIELD_TEXT = defineText({
  'zh-CN': { preparing: '正在上传', replace: '更换文件' },
  en: { preparing: 'Uploading', replace: 'Change file' },
});

interface PdfUploadFieldProps {
  upload: PdfUpload;
  onFiles: (files: File[]) => void;
  onReplace: () => void;
}

/** Drop zone until a file is picked, then a preview card of that one file with a way to swap it. */
export function PdfUploadField({ upload, onFiles, onReplace }: PdfUploadFieldProps) {
  const text = useText(UPLOAD_FIELD_TEXT);
  const commonText = useText(COMMON_TEXT);

  if (upload.state === 'idle' || upload.state === 'failed') {
    return (
      <div className="space-y-2">
        <PdfDropZone onFiles={onFiles} hint={commonText.dropFileHint} className="py-10" />
        {upload.state === 'failed' && <p className="text-caption text-danger">{upload.message}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3.5 rounded-panel bg-muted/70 p-3 ring-1 ring-border">
      <div className="relative">
        <PartThumbnail pdf={upload.state === 'ready' ? upload.pdf : undefined} />
        {upload.state === 'preparing' && (
          <span className="absolute inset-0 flex items-center justify-center rounded-card bg-surface/60">
            <Spinner className="size-4 text-score" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{importSourceName(upload.source)}</p>
        <p className="mt-0.5 text-xs text-fg-subtle tabular-nums">
          {upload.state === 'ready' ? commonText.pageCount(upload.pdf.pageCount) : text.preparing}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onReplace}>{text.replace}</Button>
    </div>
  );
}
