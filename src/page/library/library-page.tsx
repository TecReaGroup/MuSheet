import type { Space } from '@contract/api';
import { ListMusic, Music, Plus, SearchX } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useScoreList } from '@/entity/score/score-api';
import { useSetlistList } from '@/entity/setlist/setlist-api';
import { useDeclareActiveSpace } from '@/entity/space/active-space';
import { ScoreListItem } from '@/feature/library-item/score-list-item';
import { SetlistListItem } from '@/feature/library-item/setlist-list-item';
import { SortMenu } from '@/feature/library-search/sort-menu';
import { useLibrarySortStore, type LibraryCollection } from '@/feature/library-search/sort-store';
import { useImportDialogStore } from '@/feature/score-import/import-dialog-store';
import { useCreateSetlistDialogStore } from '@/feature/setlist-edit/create-setlist-dialog';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { useSearchQuery } from '@/shared/lib/use-search-query';
import { CardGrid, CardGridSkeleton } from '@/shared/ui/card-grid';
import { EmptyState } from '@/shared/ui/empty-state';
import { FloatingActionButton } from '@/shared/ui/floating-action-button';
import { PageHeader } from '@/shared/ui/page-header';
import { SearchField } from '@/shared/ui/search-field';
import { TabSwitch } from '@/shared/ui/tab-switch';
import { useLastCollectionStore } from './last-collection-store';
import { LIBRARY_TEXT } from './library-text';
import { TeamAddButton } from './team-add-button';

const COLLECTION_SKELETON_COUNT = 6;

function parseCollection(tab: string | null): LibraryCollection | undefined {
  return tab === 'score' || tab === 'setlist' ? tab : undefined;
}

/** An explicit `?tab=` wins (deep links, back buttons); a bare library URL reopens the last tab left on. */
function useLibraryCollection(space: Space) {
  const [searchParams, setSearchParams] = useSearchParams();
  const remembered = useLastCollectionStore(state => state.bySpace[space]);
  const remember = useLastCollectionStore(state => state.remember);
  const collection = parseCollection(searchParams.get('tab')) ?? remembered;
  useEffect(() => remember(space, collection), [remember, space, collection]);
  const selectCollection = (next: LibraryCollection) => setSearchParams({ tab: next }, { replace: true });
  return { collection, selectCollection };
}

interface CollectionProps {
  space: Space;
  query: string;
}

function ScoreCollection({ space, query }: CollectionProps) {
  const text = useText(LIBRARY_TEXT);
  const sortState = useLibrarySortStore(state => state.score);
  const { data, isPending } = useScoreList({ space, query: query || undefined, ...sortState });
  if (isPending) return <CardGridSkeleton count={COLLECTION_SKELETON_COUNT} />;
  if (!data || data.length === 0) {
    return query
      ? <EmptyState icon={<SearchX />} title={text.noMatchingScores} />
      : <EmptyState icon={<Music />} title={text.noScoresTitle} description={text.noScoresDescription[space]} />;
  }
  return <CardGrid>{data.map(score => <ScoreListItem key={score.id} score={score} />)}</CardGrid>;
}

function SetlistCollection({ space, query }: CollectionProps) {
  const text = useText(LIBRARY_TEXT);
  const sortState = useLibrarySortStore(state => state.setlist);
  const { data, isPending } = useSetlistList({ space, query: query || undefined, ...sortState });
  if (isPending) return <CardGridSkeleton count={COLLECTION_SKELETON_COUNT} />;
  if (!data || data.length === 0) {
    return query
      ? <EmptyState icon={<SearchX />} title={text.noMatchingSetlists} />
      : <EmptyState icon={<ListMusic />} title={text.noSetlistsTitle} description={text.noSetlistsDescription} />;
  }
  return <CardGrid>{data.map(setlist => <SetlistListItem key={setlist.id} setlist={setlist} />)}</CardGrid>;
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
  const { collection, selectCollection } = useLibraryCollection(space);
  const { query, setQuery, settledQuery } = useSearchQuery();
  const sortState = useLibrarySortStore(state => state[collection]);
  const selectSort = useLibrarySortStore(state => state.select);
  const openImport = useImportDialogStore(state => state.open);
  const openCreateSetlist = useCreateSetlistDialogStore(state => state.open);
  useDeclareActiveSpace(space);

  return (
    <>
      {/* Title, tabs and search stay put; only the collection below scrolls. Negative margins bleed the opaque band to the content edges. */}
      <PageHeader
        title={text.title[space]}
        subtitle={<LibraryCounts space={space} />}
        className="sticky top-0 z-20 -mx-4 mb-0 bg-canvas px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <TabSwitch
            className="sm:w-60 sm:shrink-0"
            label={text.collectionType}
            value={collection}
            onChange={selectCollection}
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
      {collection === 'score' ? <ScoreCollection space={space} query={settledQuery} /> : <SetlistCollection space={space} query={settledQuery} />}
      {space === 'team'
        ? <TeamAddButton collection={collection} />
        : collection === 'score'
          ? <FloatingActionButton label={text.importScore} tone="score" onClick={() => openImport(space)}><Plus /></FloatingActionButton>
          : <FloatingActionButton label={text.newSetlist} tone="setlist" onClick={() => openCreateSetlist(space)}><Plus /></FloatingActionButton>}
    </>
  );
}
