import type { ScoreSummary, SetlistSummary } from '@contract/api';
import { FileUp, ListMusic, ListPlus, Music, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { useScoreList } from '@/entity/score/score-api';
import { ScoreCard } from '@/entity/score/score-card';
import { useSetlistList } from '@/entity/setlist/setlist-api';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { SortMenu } from '@/feature/library-search/sort-menu';
import { useLibrarySortStore, type LibraryCollection } from '@/feature/library-search/sort-store';
import { useImportDialogStore } from '@/feature/score-import/import-dialog-store';
import { useCreateSetlistDialogStore } from '@/feature/setlist-edit/create-setlist-dialog';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { SearchField } from '@/shared/ui/search-field';
import { PageSpinner } from '@/shared/ui/spinner';
import { TabSwitch } from '@/shared/ui/tab-switch';
import { ScoreActionsMenu } from './score-actions-menu';
import { SetlistActionsMenu } from './setlist-actions-menu';

const SEARCH_DEBOUNCE_MS = 200;
const GRID_STYLE = 'grid gap-3 lg:grid-cols-2';

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

function ScoreCollection({ query }: { query: string }) {
  const sortState = useLibrarySortStore(state => state.score);
  const openImport = useImportDialogStore(state => state.open);
  const { data, isPending } = useScoreList({ query: query || undefined, ...sortState });
  if (isPending) return <PageSpinner />;
  if (!data || data.length === 0) {
    return query
      ? <EmptyState icon={<SearchX />} title="没有匹配的乐曲" />
      : <EmptyState icon={<Music />} title="还没有乐谱" description="导入 PDF 乐谱，或直接把文件拖进窗口。" action={<Button variant="primary" className="max-sm:w-11 max-sm:px-0" onClick={() => openImport()}><FileUp />导入乐谱</Button>} />;
  }
  return <div className={GRID_STYLE}>{data.map(score => <ScoreGridItem key={score.id} score={score} />)}</div>;
}

function SetlistCollection({ query }: { query: string }) {
  const sortState = useLibrarySortStore(state => state.setlist);
  const openCreate = useCreateSetlistDialogStore(state => state.open);
  const { data, isPending } = useSetlistList({ query: query || undefined, ...sortState });
  if (isPending) return <PageSpinner />;
  if (!data || data.length === 0) {
    return query
      ? <EmptyState icon={<SearchX />} title="没有匹配的曲目单" />
      : <EmptyState icon={<ListMusic />} title="还没有曲目单" description="把演出或排练要用的乐曲按顺序排好，翻页时自动衔接下一首。" action={<Button variant="setlist" onClick={() => openCreate()}><ListPlus />新建曲目单</Button>} />;
  }
  return <div className={GRID_STYLE}>{data.map(setlist => <SetlistGridItem key={setlist.id} setlist={setlist} />)}</div>;
}

function LibraryCounts() {
  const scores = useScoreList({ sort: 'created', order: 'desc' });
  const setlists = useSetlistList({ sort: 'created', order: 'desc' });
  if (!scores.data || !setlists.data) return null;
  return <>{setlists.data.length} 个曲目单 · {scores.data.length} 首乐曲</>;
}

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const collection: LibraryCollection = searchParams.get('tab') === 'setlist' ? 'setlist' : 'score';
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const sortState = useLibrarySortStore(state => state[collection]);
  const selectSort = useLibrarySortStore(state => state.select);
  const openImport = useImportDialogStore(state => state.open);
  const openCreateSetlist = useCreateSetlistDialogStore(state => state.open);

  return (
    <>
      <PageHeader
        title="曲库"
        subtitle={<LibraryCounts />}
        actions={collection === 'score'
          ? <Button variant="primary" className="max-sm:w-11 max-sm:px-0" onClick={() => openImport()}><FileUp /><span className="hidden sm:inline">导入乐谱</span></Button>
          : <Button variant="setlist" className="max-sm:w-11 max-sm:px-0" onClick={() => openCreateSetlist()}><ListPlus /><span className="hidden sm:inline">新建曲目单</span></Button>}
      >
        <TabSwitch
          label="内容类型"
          value={collection}
          onChange={value => setSearchParams(value === 'setlist' ? { tab: 'setlist' } : {}, { replace: true })}
          options={[
            { value: 'setlist', label: '曲目单', icon: <ListMusic />, tone: 'setlist' },
            { value: 'score', label: '乐曲', icon: <Music />, tone: 'score' },
          ]}
        />
        <div className="mt-3 flex gap-2">
          <SearchField className="flex-1" value={query} onChange={setQuery} placeholder={collection === 'score' ? '搜索乐曲或作曲' : '搜索曲目单'} />
          <SortMenu state={sortState} onSelect={sort => selectSort(collection, sort)} />
        </div>
      </PageHeader>
      {collection === 'score' ? <ScoreCollection query={debouncedQuery} /> : <SetlistCollection query={debouncedQuery} />}
    </>
  );
}
