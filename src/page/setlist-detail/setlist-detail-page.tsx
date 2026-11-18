import type { ScoreSummary, SetlistDetail } from '@contract/api';
import { Ellipsis, ListMusic, Pencil, Play, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PartThumbnail } from '@/entity/part/part-thumbnail';
import { describeParts } from '@/entity/score/score-card';
import { markSetlistOpened, useSetlistDetail, useUpdateSetlist } from '@/entity/setlist/setlist-api';
import { removeFromSetlistWithUndo, removeSetlistWithUndo, saveSetlistOrder } from '@/entity/setlist/setlist-change';
import { findPlayableIndex, viewerPath } from '@/feature/performance-mode/setlist-route';
import { AddScoresDialog } from '@/feature/setlist-edit/add-scores-dialog';
import { SetlistFormDialog } from '@/feature/setlist-edit/setlist-form-dialog';
import { log } from '@/shared/lib/logger';
import { Button, IconButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { EntityHeader } from '@/shared/ui/entity-header';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';
import { SortableList } from '@/shared/ui/sortable-list';
import { PageSpinner } from '@/shared/ui/spinner';

interface SetlistRowProps {
  setlist: SetlistDetail;
  score: ScoreSummary;
  index: number;
  dragHandle: ReactNode;
}

function SetlistRow({ setlist, score, index, dragHandle }: SetlistRowProps) {
  const navigate = useNavigate();
  const firstPart = score.parts[0];
  return (
    <div className="flex items-center gap-2 rounded-panel border border-border bg-surface py-2.5 pl-1 pr-1.5 shadow-card transition-shadow hover:shadow-lift">
      {dragHandle}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[13px] font-semibold text-fg-muted tabular-nums">{index + 1}</span>
      <button
        type="button"
        disabled={!firstPart}
        onClick={() => firstPart && navigate(viewerPath(firstPart.id, { id: setlist.id, index }))}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-tag text-left disabled:opacity-50"
      >
        <PartThumbnail pdf={firstPart} className="h-14 w-10.5" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-fg">{score.title}</span>
          <span className="mt-0.5 block truncate text-[13px] text-fg-quiet">
            {[score.composer, `${score.bpm} BPM`, describeParts(score)].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
      <IconButton label={`从曲目单移除《${score.title}》`} onClick={() => removeFromSetlistWithUndo(setlist, score.id)}><X /></IconButton>
    </div>
  );
}

export function SetlistDetailPage() {
  const { setlistId } = useParams<{ setlistId: string }>();
  const navigate = useNavigate();
  const { data: setlist, isPending, isError } = useSetlistDetail(setlistId);
  const updateSetlist = useUpdateSetlist(setlistId!);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!setlistId) return;
    markSetlistOpened(setlistId).catch(error => log('warn', 'Setlist', 'Marking opened failed', { message: String(error) }));
  }, [setlistId]);

  if (isPending) return <PageSpinner />;
  if (isError || !setlist) return <EmptyState icon={<ListMusic />} title="曲目单不存在" action={<Button onClick={() => navigate('/library?tab=setlist')}>返回曲库</Button>} />;

  const firstPlayable = findPlayableIndex(setlist.scores, -1, 1);
  const startPerformance = () => {
    const part = setlist.scores[firstPlayable]?.parts[0];
    if (part) navigate(viewerPath(part.id, { id: setlist.id, index: firstPlayable }, 1));
  };

  const deleteSetlist = () => {
    navigate('/library?tab=setlist', { replace: true });
    removeSetlistWithUndo(setlist);
  };

  return (
    <>
      <EntityHeader
        kind="setlist"
        backTo="/library?tab=setlist"
        title={setlist.name}
        subtitle={setlist.description || undefined}
        meta={`${setlist.scores.length} 首乐曲`}
        actions={(
          <>
            <IconButton label="编辑" onClick={() => setIsEditing(true)}><Pencil /></IconButton>
            <Menu>
              <MenuTrigger asChild>
                <IconButton label="更多操作"><Ellipsis /></IconButton>
              </MenuTrigger>
              <MenuContent>
                <MenuItem icon={<Plus />} onSelect={() => setIsAdding(true)}>添加乐曲</MenuItem>
                <MenuSeparator />
                <MenuItem icon={<Trash2 />} tone="danger" onSelect={deleteSetlist}>删除曲目单</MenuItem>
              </MenuContent>
            </Menu>
          </>
        )}
      />

      <div className="mb-8 flex gap-3">
        <Button variant="setlist" size="lg" disabled={firstPlayable < 0} onClick={startPerformance} className="flex-1 sm:min-w-48 sm:flex-none">
          <Play fill="currentColor" />
          开始演奏
        </Button>
        <Button size="lg" onClick={() => setIsAdding(true)}><Plus />添加乐曲</Button>
      </div>

      {setlist.scores.length === 0
        ? <EmptyState icon={<ListMusic />} title="曲目单是空的" description="添加乐曲并拖动排序，演奏时翻过最后一页会自动进入下一首。" />
        : (
          <SortableList
            items={setlist.scores}
            getId={score => score.id}
            onReorder={scores => void saveSetlistOrder(setlist, scores)}
            renderItem={(score, index, handle) => <SetlistRow setlist={setlist} score={score} index={index} dragHandle={handle} />}
          />
        )}

      <SetlistFormDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        title="编辑曲目单"
        submitLabel="保存"
        initial={{ name: setlist.name, description: setlist.description }}
        isSubmitting={updateSetlist.isPending}
        onSubmit={values => updateSetlist.mutate(values, { onSuccess: () => setIsEditing(false) })}
      />
      <AddScoresDialog setlist={setlist} open={isAdding} onOpenChange={setIsAdding} />
    </>
  );
}
