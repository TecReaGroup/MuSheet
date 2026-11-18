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
      className="group mt-4 flex w-full items-center gap-4 rounded-card border border-score-soft-2 bg-linear-to-br from-score-soft to-surface p-3 pr-4 text-left transition-shadow hover:shadow-[0_2px_12px_rgb(0_0_0/0.06)]"
    >
      <PartThumbnail pdf={part} className="h-18 w-13.5 shadow-sm" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-score">继续演奏</div>
        <div className="mt-1 truncate text-base font-semibold text-fg">{data.score.title}</div>
        <div className="mt-0.5 truncate text-[13px] text-fg-quiet tabular-nums">
          {partLabel(part)} · 第 {lastViewed.page} / {part.pageCount} 页
        </div>
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-score text-white shadow-[0_4px_12px_rgb(37_99_235/0.35)] transition-transform group-hover:scale-105 dark:text-zinc-950">
        <Play className="ml-0.5 size-5" fill="currentColor" />
      </span>
    </button>
  );
}
