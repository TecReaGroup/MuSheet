import { Play } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { partLabel } from '@/entity/part/instrument';
import { useViewerPart } from '@/entity/part/part-api';
import { PartThumbnail } from '@/entity/part/part-thumbnail';
import { readLastViewed } from '@/feature/page-turn/reading-position';
import { viewerPath } from '@/feature/performance-mode/setlist-route';

/** "Pick up where you left off": the last part read on this device, at its page. */
export function ContinueCard() {
  const [lastViewed] = useState(readLastViewed);
  const { data } = useViewerPart(lastViewed?.partId);
  const navigate = useNavigate();
  const part = data?.score.parts.find(candidate => candidate.id === lastViewed?.partId);
  if (!lastViewed || !data || !part) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(viewerPath(part.id, undefined, lastViewed.page))}
      className="group flex w-full items-center gap-4 rounded-panel border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-score/40"
    >
      <PartThumbnail pdf={part} className="h-20 w-15" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-score">继续演奏</div>
        <div className="mt-1 truncate text-[17px] font-semibold">{data.score.title}</div>
        <div className="mt-0.5 truncate text-sm text-fg-muted tabular-nums">
          {partLabel(part)} · 第 {lastViewed.page} / {part.pageCount} 页
        </div>
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-score text-white transition-transform group-hover:scale-105 dark:text-zinc-950">
        <Play className="ml-0.5 size-5" fill="currentColor" />
      </span>
    </button>
  );
}
