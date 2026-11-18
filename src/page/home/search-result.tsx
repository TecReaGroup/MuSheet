import { ListMusic, Music, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { useScoreList } from '@/entity/score/score-api';
import { ScoreCard } from '@/entity/score/score-card';
import { useSetlistList } from '@/entity/setlist/setlist-api';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { EmptyState } from '@/shared/ui/empty-state';
import { SectionHeader } from '@/shared/ui/section-header';
import { PageSpinner } from '@/shared/ui/spinner';

const RESULT_LIMIT = 30;
const RESULT_GRID_STYLE = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3';

function ResultCount({ count }: { count: number }) {
  return <span className="ml-1 text-base font-normal text-fg-subtle tabular-nums">{count}</span>;
}

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
    <div className="space-y-8">
      {setlistItems.length > 0 && (
        <section>
          <SectionHeader icon={<ListMusic />} title={<>曲目单<ResultCount count={setlistItems.length} /></>} />
          <div className={RESULT_GRID_STYLE}>
            {setlistItems.map(setlist => <SetlistCard key={setlist.id} setlist={setlist} onOpen={() => navigate(`/setlist/${setlist.id}`)} />)}
          </div>
        </section>
      )}
      {scoreItems.length > 0 && (
        <section>
          <SectionHeader icon={<Music />} title={<>乐曲<ResultCount count={scoreItems.length} /></>} />
          <div className={RESULT_GRID_STYLE}>
            {scoreItems.map(score => <ScoreCard key={score.id} score={score} onOpen={() => navigate(scoreOpenPath(score))} />)}
          </div>
        </section>
      )}
    </div>
  );
}
