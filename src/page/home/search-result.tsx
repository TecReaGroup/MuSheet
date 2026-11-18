import { SearchX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { useScoreList } from '@/entity/score/score-api';
import { ScoreCard } from '@/entity/score/score-card';
import { useSetlistList } from '@/entity/setlist/setlist-api';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageSpinner } from '@/shared/ui/spinner';

const RESULT_LIMIT = 30;

export function SearchResult({ query }: { query: string }) {
  const navigate = useNavigate();
  const scores = useScoreList({ query, sort: 'title', order: 'asc', limit: RESULT_LIMIT });
  const setlists = useSetlistList({ query, sort: 'title', order: 'asc', limit: RESULT_LIMIT });

  if (scores.isPending || setlists.isPending) return <PageSpinner />;
  const scoreItems = scores.data ?? [];
  const setlistItems = setlists.data ?? [];
  if (scoreItems.length === 0 && setlistItems.length === 0) {
    return <EmptyState icon={<SearchX />} title="没有找到匹配的内容" description="试试乐曲名、作曲者或曲目单名称" />;
  }

  return (
    <div className="mt-6 space-y-8">
      {setlistItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-[17px] font-semibold">曲目单 <span className="text-fg-subtle tabular-nums">{setlistItems.length}</span></h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {setlistItems.map(setlist => <SetlistCard key={setlist.id} setlist={setlist} onOpen={() => navigate(`/setlist/${setlist.id}`)} />)}
          </div>
        </section>
      )}
      {scoreItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-[17px] font-semibold">乐曲 <span className="text-fg-subtle tabular-nums">{scoreItems.length}</span></h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {scoreItems.map(score => <ScoreCard key={score.id} score={score} onOpen={() => navigate(scoreOpenPath(score))} />)}
          </div>
        </section>
      )}
    </div>
  );
}
