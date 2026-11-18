import { FileUp, Music } from 'lucide-react';
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
import { Logo } from '@/shared/ui/logo';
import { SearchField } from '@/shared/ui/search-field';
import { PageSpinner } from '@/shared/ui/spinner';
import { ContinueCard } from './continue-card';
import { RecentShelf } from './recent-shelf';
import { SearchResult } from './search-result';

const RECENT_LIMIT = 6;
const SEARCH_DEBOUNCE_MS = 200;

function RecentContent() {
  const navigate = useNavigate();
  const openImport = useImportDialogStore(state => state.open);
  const scores = useScoreList({ sort: 'opened', order: 'desc', limit: RECENT_LIMIT });
  const setlists = useSetlistList({ sort: 'opened', order: 'desc', limit: RECENT_LIMIT });

  if (scores.isPending || setlists.isPending) return <PageSpinner />;
  const scoreItems = scores.data ?? [];
  const setlistItems = setlists.data ?? [];

  if (scoreItems.length === 0) {
    return (
      <EmptyState
        icon={<Music />}
        title="欢迎使用 MuSheet"
        description="导入第一份 PDF 乐谱，开始你的数字谱架。"
        action={<Button variant="primary" size="lg" onClick={() => openImport()}><FileUp />导入乐谱</Button>}
      />
    );
  }

  return (
    <>
      <ContinueCard />
      {setlistItems.length > 0 && (
        <RecentShelf title="曲目单" moreTo="/library?tab=setlist">
          {setlistItems.map(setlist => <SetlistCard key={setlist.id} setlist={setlist} onOpen={() => navigate(`/setlist/${setlist.id}`)} />)}
        </RecentShelf>
      )}
      <RecentShelf title="最近乐曲" moreTo="/library">
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
      {/* Full-bleed gradient behind the header, escaping the shell's horizontal padding. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-hero-from via-hero-via to-hero-to md:left-60" />
      <header className="pb-6 pt-8 md:pt-12">
        <Logo className="md:hidden" />
        <h1 className="hidden text-[28px] font-bold tracking-[-0.02em] md:block">今天演奏什么？</h1>
        <SearchField className="mt-5 h-12 shadow-sm" value={query} onChange={setQuery} placeholder="搜索乐曲、作曲者或曲目单" />
      </header>
      {debouncedQuery ? <SearchResult query={debouncedQuery} /> : <RecentContent />}
    </>
  );
}
