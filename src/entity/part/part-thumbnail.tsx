import type { PdfFileView } from '@contract/api';
import { useState } from 'react';
import { cn } from '@/shared/lib/class-name';
import { thumbnailUrl } from '@/shared/lib/pdfjs';
import { IconTile } from '@/shared/ui/icon-tile';

interface PartThumbnailProps {
  pdf: PdfFileView | undefined;
  className?: string;
}

/** First-page preview in a portrait sheet frame; falls back to the score icon tile. */
export function PartThumbnail({ pdf, className }: PartThumbnailProps) {
  const [failed, setFailed] = useState(false);
  if (!pdf?.hasThumbnail || failed) return <IconTile kind="score" className={cn('h-16 w-12', className)} />;
  return (
    <img
      src={thumbnailUrl(pdf.sha256)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('h-16 w-12 shrink-0 rounded-tag border border-border bg-white object-cover object-top', className)}
    />
  );
}
