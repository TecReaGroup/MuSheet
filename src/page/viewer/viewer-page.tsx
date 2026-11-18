import { FileWarning } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useViewerPart } from '@/entity/part/part-api';
import { useSetlistDetail } from '@/entity/setlist/setlist-api';
import { useMetronomeStore } from '@/feature/metronome/metronome-store';
import { readSavedPage } from '@/feature/page-turn/reading-position';
import { clampPage } from '@/feature/page-turn/view-position';
import { useWakeLock } from '@/feature/performance-mode/use-wake-lock';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import { ScoreReader, type SetlistContext } from './score-reader';

/** `?page=last` (arriving backwards from the next song), an explicit number, or the saved bookmark. */
function resolveInitialPage(requested: string | null, partId: string, pageCount: number) {
  if (requested === 'last') return pageCount;
  const explicit = Number(requested);
  if (requested && Number.isFinite(explicit)) return clampPage(explicit, pageCount);
  return clampPage(readSavedPage(partId) ?? 1, pageCount);
}

export function ViewerPage() {
  const { partId } = useParams<{ partId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setlistId = searchParams.get('setlist') ?? undefined;
  const setlistIndex = Number(searchParams.get('index') ?? -1);
  const viewer = useViewerPart(partId);
  const setlist = useSetlistDetail(setlistId);
  useWakeLock();

  // Leaving the viewer silences the metronome; moving between songs keeps it running.
  useEffect(() => () => useMetronomeStore.getState().stop(), []);

  const part = viewer.data?.score.parts.find(candidate => candidate.id === partId);
  const isWaitingForSetlist = Boolean(setlistId) && setlist.isPending;

  if (viewer.isError || (viewer.data && !part)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-canvas text-center">
        <FileWarning className="size-12 text-fg-subtle" />
        <p className="text-fg-muted">乐谱不存在或已被删除</p>
        <Button onClick={() => navigate('/library', { replace: true })}>返回曲库</Button>
      </div>
    );
  }

  if (!viewer.data || !part || isWaitingForSetlist) {
    return <div className="fixed inset-0 flex items-center justify-center bg-canvas"><Spinner className="size-7" /></div>;
  }

  const setlistContext: SetlistContext | undefined = setlist.data && setlistIndex >= 0 && setlist.data.scores[setlistIndex]?.id === viewer.data.score.id
    ? { setlist: setlist.data, index: setlistIndex }
    : undefined;

  return (
    <ScoreReader
      key={part.id}
      score={viewer.data.score}
      part={part}
      initialPage={resolveInitialPage(searchParams.get('page'), part.id, part.pageCount)}
      setlistContext={setlistContext}
    />
  );
}
