import type { ScoreSummary, SetlistDetail } from '@contract/api';
import { ListMusic, Music, Pencil, Play, Plus, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PartThumbnail } from '@/entity/part/part-thumbnail';
import { describeParts } from '@/entity/score/score-card';
import { markSetlistOpened, useSetlistDetail, useUpdateSetlist } from '@/entity/setlist/setlist-api';
import { removeFromSetlistWithUndo, saveSetlistOrder } from '@/entity/setlist/setlist-change';
import { useDeclareActiveSpace } from '@/entity/space/active-space';
import { setlistCollectionPath } from '@/entity/space/space-path';
import { findPlayableIndex, viewerPath } from '@/feature/performance-mode/setlist-route';
import { AddScoresDialog } from '@/feature/setlist-edit/add-scores-dialog';
import { SetlistFormDialog } from '@/feature/setlist-edit/setlist-form-dialog';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { log } from '@/shared/lib/logger';
import { Button, IconButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { EntityHeader, EntityPageSkeleton } from '@/shared/ui/entity-header';
import { SectionHeader } from '@/shared/ui/section-header';
import { SortableList, SortableRowCard } from '@/shared/ui/sortable-list';

const SETLIST_DETAIL_TEXT = defineText({
  'zh-CN': {
    notFound: '谱单不存在',
    addScores: '添加乐谱',
    emptyTitle: '谱单是空的',
    emptyDescription: '添加乐谱并拖动排序，演奏时翻过最后一页会自动进入下一首',
    editSetlist: '编辑谱单',
    removeScore: (title: string) => `从谱单移除《${title}》`,
  },
  en: {
    notFound: 'Setlist not found',
    addScores: 'Add scores',
    emptyTitle: 'This setlist is empty',
    emptyDescription: 'Add scores and drag to reorder; turning past the last page moves on to the next score.',
    editSetlist: 'Edit setlist',
    removeScore: (title: string) => `Remove "${title}" from the setlist`,
  },
});

interface SetlistRowProps {
  setlist: SetlistDetail;
  score: ScoreSummary;
  index: number;
  dragHandle: ReactNode;
}

function SetlistRow({ setlist, score, index, dragHandle }: SetlistRowProps) {
  const navigate = useNavigate();
  const firstPart = score.parts[0];
  const text = useText(SETLIST_DETAIL_TEXT);
  return (
    <SortableRowCard dragHandle={dragHandle}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-semibold text-fg-muted tabular-nums">{index + 1}</span>
      <button
        type="button"
        disabled={!firstPart}
        onClick={() => firstPart && navigate(viewerPath(firstPart.id, { id: setlist.id, index }))}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-tag text-left disabled:opacity-50"
      >
        <PartThumbnail pdf={firstPart} className="h-14 w-10.5" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-fg">{score.title}</span>
          <span className="mt-0.5 block truncate text-caption text-fg-quiet">
            {[score.composer, `${score.bpm} BPM`, describeParts(score)].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
      <IconButton label={text.removeScore(score.title)} onClick={() => removeFromSetlistWithUndo(setlist, score.id)}><X /></IconButton>
    </SortableRowCard>
  );
}

export function SetlistDetailPage() {
  const { setlistId } = useParams<{ setlistId: string }>();
  const navigate = useNavigate();
  const { data: setlist, isPending, isError } = useSetlistDetail(setlistId);
  useDeclareActiveSpace(setlist?.space);
  const updateSetlist = useUpdateSetlist(setlistId!);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const text = useText(SETLIST_DETAIL_TEXT);
  const commonText = useText(COMMON_TEXT);

  useEffect(() => {
    if (!setlistId) return;
    markSetlistOpened(setlistId).catch(error => log('warn', 'Setlist', 'Marking opened failed', { message: String(error) }));
  }, [setlistId]);

  if (isPending) return <EntityPageSkeleton />;
  if (isError || !setlist) return <EmptyState icon={<ListMusic />} title={text.notFound} action={<Button onClick={() => navigate(setlistCollectionPath('personal'))}>{commonText.backToLibrary}</Button>} />;

  const firstPlayable = findPlayableIndex(setlist.scores, -1, 1);
  const startPerformance = () => {
    const part = setlist.scores[firstPlayable]?.parts[0];
    if (part) navigate(viewerPath(part.id, { id: setlist.id, index: firstPlayable }, 1));
  };

  return (
    <div className="animate-fade-in">
      <EntityHeader
        kind="setlist"
        backTo={setlistCollectionPath(setlist.space)}
        title={setlist.name}
        subtitle={setlist.description || undefined}
        meta={commonText.scoreCount(setlist.scores.length)}
        actions={<IconButton label={commonText.edit} onClick={() => setIsEditing(true)}><Pencil /></IconButton>}
      />

      {firstPlayable >= 0 && (
        <Button variant="setlist" size="lg" className="mb-10 w-full sm:w-auto sm:min-w-48" onClick={startPerformance}>
          <Play fill="currentColor" />
          {commonText.play}
        </Button>
      )}

      <section>
        <SectionHeader
          icon={<Music />}
          title={commonText.score}
          action={<Button size="sm" variant="ghost" className="text-setlist hover:bg-setlist-soft hover:text-setlist" onClick={() => setIsAdding(true)}><Plus />{text.addScores}</Button>}
        />
        {setlist.scores.length === 0
          ? <EmptyState className="py-8" icon={<ListMusic />} title={text.emptyTitle} description={text.emptyDescription} action={<Button variant="setlist" onClick={() => setIsAdding(true)}>{text.addScores}</Button>} />
          : (
            <SortableList
              items={setlist.scores}
              getId={score => score.id}
              onReorder={scores => void saveSetlistOrder(setlist, scores)}
              renderItem={(score, index, handle) => <SetlistRow setlist={setlist} score={score} index={index} dragHandle={handle} />}
            />
          )}
      </section>

      <SetlistFormDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        title={text.editSetlist}
        submitLabel={commonText.save}
        initial={{ name: setlist.name, description: setlist.description }}
        isSubmitting={updateSetlist.isPending}
        onSubmit={values => updateSetlist.mutate(values, { onSuccess: () => setIsEditing(false) })}
      />
      <AddScoresDialog setlist={setlist} open={isAdding} onOpenChange={setIsAdding} />
    </div>
  );
}
