import type { ScoreSummary, SetlistSummary, Space } from '@contract/api';
import { LibraryBig, ListMusic, Music, Plus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { useScoreList } from '@/entity/score/score-api';
import { ScoreCard } from '@/entity/score/score-card';
import { useSetlistList } from '@/entity/setlist/setlist-api';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { useDeclareActiveSpace } from '@/entity/space/active-space';
import { SortMenu } from '@/feature/library-search/sort-menu';
import { useLibrarySortStore, type LibraryCollection } from '@/feature/library-search/sort-store';
import { useImportDialogStore } from '@/feature/score-import/import-dialog-store';
import { useCreateSetlistDialogStore } from '@/feature/setlist-edit/create-setlist-dialog';
import { TeamScoreCopyDialog, TeamSetlistCopyDialog } from '@/feature/team-share/team-copy-dialog';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { EmptyState } from '@/shared/ui/empty-state';
import { FloatingActionButton } from '@/shared/ui/floating-action-button';
import { PageHeader } from '@/shared/ui/page-header';
import { SearchField } from '@/shared/ui/search-field';
import { PageSpinner } from '@/shared/ui/spinner';
import { TabSwitch } from '@/shared/ui/tab-switch';
import { LIBRARY_TEXT } from './library-text';
import { ScoreActionsMenu } from './score-actions-menu';
import { SetlistActionsMenu } from './setlist-actions-menu';

const SEARCH_DEBOUNCE_MS = 200;
const GRID_STYLE = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3';

function ScoreGridItem({ score }: { score: ScoreSummary }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <ScoreCard
      score={score}
      onOpen={() => navigate(scoreOpenPath(score))}
      onContextMenu={event => { event.preventDefault(); setMenuOpen(true); }}
      actions={<ScoreActionsMenu score={score} open={menuOpen} onOpenChange={setMenuOpen} />}
    />
  );
}

function SetlistGridItem({ setlist }: { setlist: SetlistSummary }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <SetlistCard
      setlist={setlist}
      onOpen={() => navigate(`/setlist/${setlist.id}`)}
      onContextMenu={event => { event.preventDefault(); setMenuOpen(true); }}
      actions={<SetlistActionsMenu setlist={setlist} open={menuOpen} onOpenChange={setMenuOpen} />}
    />
  );
}

interface CollectionProps {
  space: Space;
  query: string;
}

function ScoreCollection({ space, query }: CollectionProps) {
  const text = useText(LIBRARY_TEXT);
  const sortState = useLibrarySortStore(state => state.score);
  const { data, isPending } = useScoreList({ space, query: query || undefined, ...sortState });
  if (isPending) return <PageSpinner />;
  if (!data || data.length === 0) {
    return query
      ? <EmptyState icon={<SearchX />} title={text.noMatchingScores} />
      : <EmptyState icon={<Music />} title={text.noScoresTitle} description={text.noScoresDescription[space]} />;
  }
  return <div className={GRID_STYLE}>{data.map(score => <ScoreGridItem key={score.id} score={score} />)}</div>;
}

function SetlistCollection({ space, query }: CollectionProps) {
  const text = useText(LIBRARY_TEXT);
  const sortState = useLibrarySortStore(state => state.setlist);
  const { data, isPending } = useSetlistList({ space, query: query || undefined, ...sortState });
  if (isPending) return <PageSpinner />;
  if (!data || data.length === 0) {
    return query
      ? <EmptyState icon={<SearchX />} title={text.noMatchingSetlists} />
      : <EmptyState icon={<ListMusic />} title={text.noSetlistsTitle} description={text.noSetlistsDescription} />;
  }
  return <div className={GRID_STYLE}>{data.map(setlist => <SetlistGridItem key={setlist.id} setlist={setlist} />)}</div>;
}

function LibraryCounts({ space }: { space: Space }) {
  const text = useText(LIBRARY_TEXT);
  const scores = useScoreList({ space, sort: 'created', order: 'desc' });
  const setlists = useSetlistList({ space, sort: 'created', order: 'desc' });
  if (!scores.data || !setlists.data) return null;
  return text.counts(setlists.data.length, scores.data.length);
}

/** One page for both libraries: `/library` (personal) and `/team` (shared). */
export function LibraryPage({ space }: { space: Space }) {
  const text = useText(LIBRARY_TEXT);
  const commonText = useText(COMMON_TEXT);
  const [searchParams, setSearchParams] = useSearchParams();
  const collection: LibraryCollection = searchParams.get('tab') === 'setlist' ? 'setlist' : 'score';
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const sortState = useLibrarySortStore(state => state[collection]);
  const selectSort = useLibrarySortStore(state => state.select);
  const openImport = useImportDialogStore(state => state.open);
  const openCreateSetlist = useCreateSetlistDialogStore(state => state.open);
  const [isCopyingFromLibrary, setIsCopyingFromLibrary] = useState(false);
  const canCopyFromLibrary = space === 'team';
  useDeclareActiveSpace(space);

  return (
    <>
      <PageHeader
        title={text.title[space]}
        subtitle={<LibraryCounts space={space} />}
        actions={canCopyFromLibrary && (
          <Button size="sm" onClick={() => setIsCopyingFromLibrary(true)}>
            <LibraryBig />
            {text.copyFromLibrary}
          </Button>
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <TabSwitch
            className="sm:w-60 sm:shrink-0"
            label={text.collectionType}
            value={collection}
            onChange={value => setSearchParams(value === 'setlist' ? { tab: 'setlist' } : {}, { replace: true })}
            options={[
              { value: 'score', label: commonText.score, icon: <Music />, tone: 'score' },
              { value: 'setlist', label: commonText.setlist, icon: <ListMusic />, tone: 'setlist' },
            ]}
          />
          <div className="flex flex-1 gap-2">
            <SearchField className="flex-1" value={query} onChange={setQuery} placeholder={collection === 'score' ? text.searchScores : text.searchSetlists} />
            <SortMenu state={sortState} onSelect={sort => selectSort(collection, sort)} />
          </div>
        </div>
      </PageHeader>
      {collection === 'score' ? <ScoreCollection space={space} query={debouncedQuery} /> : <SetlistCollection space={space} query={debouncedQuery} />}
      {collection === 'score'
        ? <FloatingActionButton label={text.importScores} tone="score" onClick={() => openImport(space)}><Plus /></FloatingActionButton>
        : <FloatingActionButton label={text.newSetlist} tone="setlist" onClick={() => openCreateSetlist(space)}><Plus /></FloatingActionButton>}
      <TeamScoreCopyDialog open={isCopyingFromLibrary && collection === 'score'} onOpenChange={setIsCopyingFromLibrary} />
      <TeamSetlistCopyDialog open={isCopyingFromLibrary && collection === 'setlist'} onOpenChange={setIsCopyingFromLibrary} />
    </>
  );
}
