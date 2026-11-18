import { FileUp, ListMusic, Music } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { useScoreList } from '@/entity/score/score-api';
import { ScoreCard } from '@/entity/score/score-card';
import { useSetlistList } from '@/entity/setlist/setlist-api';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { useImportDialogStore } from '@/feature/score-import/import-dialog-store';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Wordmark } from '@/shared/ui/logo';
import { SearchField } from '@/shared/ui/search-field';
import { PageSpinner } from '@/shared/ui/spinner';
import { StatCard } from '@/shared/ui/stat-card';
import { ContinueCard } from './continue-card';
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
    <div className="grid grid-cols-2 gap-3">
      <StatCard kind="score" count={scores.data?.length} to="/library" />
      <StatCard kind="setlist" count={setlists.data?.length} to="/library?tab=setlist" />
    </div>
  );
}

function RecentContent() {
  const navigate = useNavigate();
  const openImport = useImportDialogStore(state => state.open);
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
          action={<Button variant="primary" size="lg" onClick={() => openImport()}><FileUp />导入乐谱</Button>}
        />
      </>
    );
  }

  return (
    <>
      <LibraryStats />
      <ContinueCard />
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
      <header className="band band-hero pb-10 pt-[calc(1rem+env(safe-area-inset-top))] md:pb-12 md:pt-10">
        <Wordmark className="md:hidden" />
        <h1 className="hidden text-[30px] font-semibold leading-tight text-fg-title md:block">今天演奏什么？</h1>
        <SearchField className="mt-4 h-12 border-transparent shadow-[0_1px_3px_rgb(0_0_0/0.06)]" value={query} onChange={setQuery} placeholder="搜索乐曲、作曲者或曲目单" />
      </header>
      {/* Content sheet overlaps the hero so its rounded top shows the gradient behind it. */}
      <div className="relative -mx-4 -mt-6 min-h-[calc(100dvh-14rem)] rounded-t-panel bg-linear-to-b from-surface to-canvas px-4 pb-6 pt-5 shadow-[0_8px_30px_rgb(0_0_0/0.12)] sm:mx-0 sm:rounded-panel sm:px-6 sm:pt-6">
        {debouncedQuery ? <SearchResult query={debouncedQuery} /> : <RecentContent />}
      </div>
    </>
  );
}
