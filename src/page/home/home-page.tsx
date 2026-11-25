import { ListMusic, Music } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { ScoreCard } from '@/entity/score/score-card';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { SpaceLabel, SPACE_TEXT } from '@/entity/space/space-label';
import { useText } from '@/shared/i18n/text';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { EmptyState } from '@/shared/ui/empty-state';
import { Wordmark } from '@/shared/ui/logo';
import { SearchField } from '@/shared/ui/search-field';
import { PageSpinner } from '@/shared/ui/spinner';
import { StatCard } from '@/shared/ui/stat-card';
import { HOME_TEXT } from './home-text';
import { RecentShelf } from './recent-shelf';
import { SearchResult } from './search-result';
import { byRecentlyOpened, useScoresFromBothSpaces, useSetlistsFromBothSpaces } from './use-both-spaces';

const RECENT_SCORE_LIMIT = 4;
const RECENT_SETLIST_LIMIT = 3;
const SEARCH_DEBOUNCE_MS = 200;

const byNewest = (left: { createdAt: string }, right: { createdAt: string }) => right.createdAt.localeCompare(left.createdAt);

function LibraryStats() {
  // Same queries as the library headers, so the counts are shared from cache.
  const scores = useScoresFromBothSpaces({ sort: 'created', order: 'desc' }, byNewest);
  const setlists = useSetlistsFromBothSpaces({ sort: 'created', order: 'desc' }, byNewest);
  const spaceText = useText(SPACE_TEXT);
  const breakdown = (personal: number, team: number) => `${spaceText.personal} ${personal} · ${spaceText.team} ${team}`;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <StatCard
        kind="score"
        count={scores.isPending ? undefined : scores.items.length}
        detail={!scores.isPending && breakdown(scores.personalCount, scores.teamCount)}
        to="/library"
      />
      <StatCard
        kind="setlist"
        count={setlists.isPending ? undefined : setlists.items.length}
        detail={!setlists.isPending && breakdown(setlists.personalCount, setlists.teamCount)}
        to="/library?tab=setlist"
      />
    </div>
  );
}

function RecentContent() {
  const navigate = useNavigate();
  const text = useText(HOME_TEXT);
  const scores = useScoresFromBothSpaces({ sort: 'opened', order: 'desc', limit: RECENT_SCORE_LIMIT }, byRecentlyOpened);
  const setlists = useSetlistsFromBothSpaces({ sort: 'opened', order: 'desc', limit: RECENT_SETLIST_LIMIT }, byRecentlyOpened);

  if (scores.isPending || setlists.isPending) return <PageSpinner />;
  const scoreItems = scores.items;
  const setlistItems = setlists.items;

  if (scoreItems.length === 0) {
    return (
      <>
        <LibraryStats />
        <EmptyState
          icon={<Music />}
          title={text.welcomeTitle}
          description={text.welcomeDescription}
        />
      </>
    );
  }

  return (
    <>
      <LibraryStats />
      {setlistItems.length > 0 && (
        <RecentShelf icon={<ListMusic />} title={text.recentSetlists} moreTo="/library?tab=setlist">
          {setlistItems.map(setlist => <SetlistCard key={setlist.id} setlist={setlist} badge={<SpaceLabel space={setlist.space} />} onOpen={() => navigate(`/setlist/${setlist.id}`)} />)}
        </RecentShelf>
      )}
      <RecentShelf icon={<Music />} title={text.recentScores} moreTo="/library">
        {scoreItems.map(score => <ScoreCard key={score.id} score={score} badge={<SpaceLabel space={score.space} />} onOpen={() => navigate(scoreOpenPath(score))} />)}
      </RecentShelf>
    </>
  );
}

export function HomePage() {
  const text = useText(HOME_TEXT);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  return (
    <>
      <header className="mb-6 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-10">
        <Wordmark className="md:hidden" />
        <SearchField className="mt-5 h-12 md:mt-0 md:max-w-xl" value={query} onChange={setQuery} placeholder={text.searchPlaceholder} />
      </header>
      {debouncedQuery ? <SearchResult query={debouncedQuery} /> : <RecentContent />}
    </>
  );
}
