import type { PartView, ScoreSummary } from '@contract/api';
import { FilePlus2, Layers, ListMusic, Pencil, Play, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { deletePart, useReorderParts } from '@/entity/part/part-api';
import { PartThumbnail } from '@/entity/part/part-thumbnail';
import { scoreKey, useScoreDetail } from '@/entity/score/score-api';
import { useDeclareActiveSpace } from '@/entity/space/active-space';
import { scoreCollectionPath } from '@/entity/space/space-path';
import { AddPartDialog } from '@/feature/score-import/add-part-dialog';
import { invalidateLibrary, queryClient } from '@/shared/api/query-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { runUndoable } from '@/shared/lib/undoable';
import { Button, IconButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { EntityHeader, EntityPageSkeleton } from '@/shared/ui/entity-header';
import { SectionHeader } from '@/shared/ui/section-header';
import { SortableList, SortableRowCard } from '@/shared/ui/sortable-list';
import { EditScoreDialog } from './edit-score-dialog';

const SCORE_DETAIL_TEXT = defineText({
  'zh-CN': {
    notFound: '乐谱不存在',
    addPart: '添加声部',
    noPartsTitle: '还没有声部',
    noPartsDescription: '为这份乐谱添加一份 PDF 分谱',
    deletePart: (part: string) => `删除${part}声部`,
    partDeleted: (part: string) => `已删除${part}声部`,
  },
  en: {
    notFound: 'Score not found',
    addPart: 'Add part',
    noPartsTitle: 'No parts yet',
    noPartsDescription: 'Add a PDF part to this score.',
    deletePart: (part: string) => `Delete the ${part} part`,
    partDeleted: (part: string) => `Deleted the ${part} part`,
  },
});

function removePartWithUndo(score: ScoreSummary, part: PartView) {
  const key = scoreKey.detail(score.id);
  runUndoable({
    message: readText(SCORE_DETAIL_TEXT).partDeleted(part.name),
    apply: () => queryClient.setQueryData<ScoreSummary>(key, { ...score, parts: score.parts.filter(item => item.id !== part.id) }),
    commit: async () => {
      await deletePart(part.id);
      await invalidateLibrary();
    },
    revert: () => queryClient.setQueryData<ScoreSummary>(key, score),
  });
}

function PartRow({ score, part, dragHandle }: { score: ScoreSummary; part: PartView; dragHandle: ReactNode }) {
  const navigate = useNavigate();
  const text = useText(SCORE_DETAIL_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <SortableRowCard dragHandle={dragHandle}>
      <button type="button" onClick={() => navigate(`/view/${part.id}`)} className="flex min-w-0 flex-1 items-center gap-3 rounded-tag text-left">
        <PartThumbnail pdf={part} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-fg">{part.name}</span>
          <span className="mt-0.5 block text-xs text-fg-subtle tabular-nums">{commonText.pageCount(part.pageCount)}</span>
        </span>
      </button>
      <IconButton label={text.deletePart(part.name)} variant="dangerGhost" onClick={() => removePartWithUndo(score, part)}><Trash2 /></IconButton>
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
    queryClient.setQueryData<ScoreSummary>(scoreKey.detail(score.id), { ...score, parts });
    reorderParts.mutate(parts.map(part => part.id));
  };

  return (
    <div className="animate-fade-in">
      <EntityHeader
        kind="score"
        backTo={scoreCollectionPath(score.space)}
        title={score.title}
        subtitle={score.composer || commonText.noComposer}
        meta={[`${score.bpm} BPM`, commonText.partCount(score.parts.length)].join(' · ')}
        actions={<IconButton label={commonText.edit} onClick={() => setIsEditing(true)}><Pencil /></IconButton>}
      />

      {score.parts[0] && (
        <Button variant="primary" size="lg" className="mb-10 w-full sm:w-auto sm:min-w-48" onClick={() => navigate(`/view/${score.parts[0]!.id}`)}>
          <Play fill="currentColor" />
          {commonText.play}
        </Button>
      )}

      <section>
        <SectionHeader
          icon={<Layers />}
          title={commonText.part}
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
