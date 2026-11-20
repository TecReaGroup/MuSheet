import { ListMusic, Music } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { useScoreList } from '@/entity/score/score-api';
import { ScoreCard } from '@/entity/score/score-card';
import { useSetlistList } from '@/entity/setlist/setlist-api';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { EmptyState } from '@/shared/ui/empty-state';
import { Wordmark } from '@/shared/ui/logo';
import { SearchField } from '@/shared/ui/search-field';
import { PageSpinner } from '@/shared/ui/spinner';
import { StatCard } from '@/shared/ui/stat-card';
import { RecentShelf } from './recent-shelf';
import { SearchResult } from './search-result';

const RECENT_SCORE_LIMIT = 4;
const RECENT_SETLIST_LIMIT = 3;
const SEARCH_DEBOUNCE_MS = 200;

function LibraryStats() {
  // Same queries as the library header, so the counts are shared from cache.
  const scores = useScoreList({ sort: 'created', order: 'desc' });
  const setlists = useSetlistList({ sort: 'created', order: 'desc' });
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <StatCard kind="score" count={scores.data?.length} to="/library" />
      <StatCard kind="setlist" count={setlists.data?.length} to="/library?tab=setlist" />
    </div>
  );
}

function RecentContent() {
  const navigate = useNavigate();
  const scores = useScoreList({ sort: 'opened', order: 'desc', limit: RECENT_SCORE_LIMIT });
  const setlists = useSetlistList({ sort: 'opened', order: 'desc', limit: RECENT_SETLIST_LIMIT });

  if (scores.isPending || setlists.isPending) return <PageSpinner />;
  const scoreItems = scores.data ?? [];
  const setlistItems = setlists.data ?? [];

  if (scoreItems.length === 0) {
    return (
      <>
        <LibraryStats />
        <EmptyState
          icon={<Music />}
          title="欢迎使用 MuSheet"
          description="导入第一份 PDF 乐谱，开始你的数字谱架。"
        />
      </>
    );
  }

  return (
    <>
      <LibraryStats />
      {setlistItems.length > 0 && (
        <RecentShelf icon={<ListMusic />} title="最近曲目单" moreTo="/library?tab=setlist">
          {setlistItems.map(setlist => <SetlistCard key={setlist.id} setlist={setlist} onOpen={() => navigate(`/setlist/${setlist.id}`)} />)}
        </RecentShelf>
      )}
      <RecentShelf icon={<Music />} title="最近乐曲" moreTo="/library">
        {scoreItems.map(score => <ScoreCard key={score.id} score={score} onOpen={() => navigate(scoreOpenPath(score))} />)}
      </RecentShelf>
    </>
  );
}

export function HomePage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  return (
    <>
      <header className="mb-6 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-10">
        <Wordmark className="md:hidden" />
        <SearchField className="mt-5 h-12 md:mt-0 md:max-w-xl" value={query} onChange={setQuery} placeholder="搜索乐曲、作曲者或曲目单" />
      </header>
      {debouncedQuery ? <SearchResult query={debouncedQuery} /> : <RecentContent />}
    </>
  );
}
