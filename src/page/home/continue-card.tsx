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
      className="group mb-4 flex w-full items-center gap-4 rounded-panel bg-linear-to-br from-score-solid-from to-score-solid-to p-3 pr-4 text-left text-white shadow-lift transition-shadow hover:shadow-float sm:p-4 sm:pr-5"
    >
      <PartThumbnail pdf={part} className="h-20 w-15 shadow-lift ring-2 ring-white/25" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold tracking-wide text-white/75">继续演奏</div>
        <div className="mt-1 truncate text-lg font-semibold">{data.score.title}</div>
        <div className="mt-0.5 truncate text-[13px] text-white/75 tabular-nums">
          {partLabel(part)} · 第 {lastViewed.page} / {part.pageCount} 页
        </div>
      </div>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-score-solid-to shadow-lift transition-transform group-hover:scale-105">
        <Play className="ml-0.5 size-5" fill="currentColor" />
      </span>
    </button>
  );
}
