import type { PartView, ScoreDetail } from '@contract/api';
import { Ellipsis, FilePlus2, Layers, ListMusic, Pencil, Play, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { deletePart, useReorderParts } from '@/entity/part/part-api';
import { PartThumbnail } from '@/entity/part/part-thumbnail';
import { removeScoreWithUndo } from '@/entity/score/remove-score';
import { scoreKey, useScoreDetail } from '@/entity/score/score-api';
import { useDeclareActiveSpace } from '@/entity/space/active-space';
import { scoreCollectionPath } from '@/entity/space/space-path';
import { AddPartDialog } from '@/feature/score-import/add-part-dialog';
import { AddToSetlistMenu } from '@/feature/setlist-edit/add-to-setlist-menu';
import { invalidateLibrary, queryClient } from '@/shared/api/query-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { runUndoable } from '@/shared/lib/undoable';
import { Button, IconButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { EntityHeader, EntityPageSkeleton } from '@/shared/ui/entity-header';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';
import { SectionHeader } from '@/shared/ui/section-header';
import { SortableList, SortableRowCard } from '@/shared/ui/sortable-list';
import { EditScoreDialog } from './edit-score-dialog';

const SCORE_DETAIL_TEXT = defineText({
  'zh-CN': {
    notFound: '乐曲不存在',
    deleteScore: '删除乐曲',
    startReading: '开始阅读',
    addPart: '添加声部',
    noPartsTitle: '还没有声部',
    noPartsDescription: '为这首乐曲添加一份 PDF 分谱。',
    deletePart: (part: string) => `删除${part}声部`,
    partDeleted: (part: string) => `已删除${part}声部`,
  },
  en: {
    notFound: 'Score not found',
    deleteScore: 'Delete score',
    startReading: 'Start reading',
    addPart: 'Add part',
    noPartsTitle: 'No parts yet',
    noPartsDescription: 'Add a PDF part to this score.',
    deletePart: (part: string) => `Delete the ${part} part`,
    partDeleted: (part: string) => `Deleted the ${part} part`,
  },
});

function removePartWithUndo(score: ScoreDetail, part: PartView) {
  const key = scoreKey.detail(score.id);
  runUndoable({
    message: readText(SCORE_DETAIL_TEXT).partDeleted(part.tag),
    apply: () => queryClient.setQueryData<ScoreDetail>(key, { ...score, parts: score.parts.filter(item => item.id !== part.id) }),
    commit: async () => {
      await deletePart(part.id);
      await invalidateLibrary();
    },
    revert: () => queryClient.setQueryData<ScoreDetail>(key, score),
  });
}

function PartRow({ score, part, dragHandle }: { score: ScoreDetail; part: PartView; dragHandle: ReactNode }) {
  const navigate = useNavigate();
  const text = useText(SCORE_DETAIL_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <SortableRowCard dragHandle={dragHandle}>
      <button type="button" onClick={() => navigate(`/view/${part.id}`)} className="flex min-w-0 flex-1 items-center gap-3 rounded-tag text-left">
        <PartThumbnail pdf={part} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-fg">{part.tag}</span>
          <span className="mt-0.5 block text-xs text-fg-subtle tabular-nums">{commonText.pageCount(part.pageCount)}</span>
        </span>
      </button>
      <IconButton label={text.deletePart(part.tag)} onClick={() => removePartWithUndo(score, part)}><Trash2 /></IconButton>
    </SortableRowCard>
  );
}

export function ScoreDetailPage() {
  const { scoreId } = useParams<{ scoreId: string }>();
  const navigate = useNavigate();
  const { data: score, isPending, isError } = useScoreDetail(scoreId);
  useDeclareActiveSpace(score?.space);
  const reorderParts = useReorderParts(scoreId!);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const text = useText(SCORE_DETAIL_TEXT);
  const commonText = useText(COMMON_TEXT);

  if (isPending) return <EntityPageSkeleton />;
  if (isError || !score) return <EmptyState icon={<ListMusic />} title={text.notFound} action={<Button onClick={() => navigate('/library')}>{commonText.backToLibrary}</Button>} />;

  const reorder = (parts: PartView[]) => {
    queryClient.setQueryData<ScoreDetail>(scoreKey.detail(score.id), { ...score, parts });
    reorderParts.mutate(parts.map(part => part.id));
  };

  const deleteScore = () => {
    navigate(scoreCollectionPath(score.space), { replace: true });
    removeScoreWithUndo(score);
  };

  return (
    <div className="animate-fade-in">
      <EntityHeader
        kind="score"
        backTo={scoreCollectionPath(score.space)}
        title={score.title}
        subtitle={score.composer || commonText.noComposer}
        meta={[`${score.bpm} BPM`, score.timeSignature, commonText.partCount(score.parts.length)].join(' · ')}
        actions={(
          <>
            <IconButton label={commonText.edit} onClick={() => setIsEditing(true)}><Pencil /></IconButton>
            <Menu>
              <MenuTrigger asChild>
                <IconButton label={commonText.moreActions}><Ellipsis /></IconButton>
              </MenuTrigger>
              <MenuContent>
                <AddToSetlistMenu score={score} excludeSetlistIds={score.setlists.map(setlist => setlist.id)} />
                <MenuSeparator />
                <MenuItem icon={<Trash2 />} tone="danger" onSelect={deleteScore}>{text.deleteScore}</MenuItem>
              </MenuContent>
            </Menu>
          </>
        )}
      />

      {score.parts[0] && (
        <Button variant="primary" size="lg" className="mb-10 w-full sm:w-auto sm:min-w-48" onClick={() => navigate(`/view/${score.parts[0]!.id}`)}>
          <Play fill="currentColor" />
          {text.startReading}
        </Button>
      )}

      <section>
        <SectionHeader
          icon={<Layers />}
          title={commonText.tag}
          action={<Button size="sm" variant="ghost" className="text-score hover:bg-score-soft hover:text-score" onClick={() => setIsAddingPart(true)}><FilePlus2 />{text.addPart}</Button>}
        />
        {score.parts.length === 0
          ? <EmptyState className="py-8" icon={<FilePlus2 />} title={text.noPartsTitle} description={text.noPartsDescription} action={<Button variant="primary" onClick={() => setIsAddingPart(true)}>{text.addPart}</Button>} />
          : (
            <SortableList
              items={score.parts}
              getId={part => part.id}
              onReorder={reorder}
              renderItem={(part, _index, handle) => <PartRow score={score} part={part} dragHandle={handle} />}
            />
          )}
      </section>

      <EditScoreDialog score={score} open={isEditing} onOpenChange={setIsEditing} />
      <AddPartDialog score={score} open={isAddingPart} onOpenChange={setIsAddingPart} />
    </div>
  );
}
