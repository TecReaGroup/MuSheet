import type { PartView, ScoreDetail } from '@contract/api';
import { Ellipsis, FilePlus2, ListMusic, Pencil, Play, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { partLabel } from '@/entity/part/instrument';
import { deletePart, useReorderParts } from '@/entity/part/part-api';
import { PartThumbnail } from '@/entity/part/part-thumbnail';
import { removeScoreWithUndo } from '@/entity/score/remove-score';
import { scoreKey, useScoreDetail } from '@/entity/score/score-api';
import { AddPartDialog } from '@/feature/score-import/add-part-dialog';
import { AddToSetlistMenu } from '@/feature/setlist-edit/add-to-setlist-menu';
import { invalidateLibrary, queryClient } from '@/shared/api/query-client';
import { runUndoable } from '@/shared/lib/undoable';
import { Button, IconButton } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';
import { PageHeader } from '@/shared/ui/page-header';
import { SortableList } from '@/shared/ui/sortable-list';
import { PageSpinner } from '@/shared/ui/spinner';
import { EditScoreDialog } from './edit-score-dialog';

function removePartWithUndo(score: ScoreDetail, part: PartView) {
  const key = scoreKey.detail(score.id);
  runUndoable({
    message: `已删除${partLabel(part)}声部`,
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
  return (
    <div className="flex items-center gap-2 rounded-card border border-border bg-surface p-2 pr-1">
      {dragHandle}
      <button type="button" onClick={() => navigate(`/view/${part.id}`)} className="flex min-w-0 flex-1 items-center gap-3 rounded-tag text-left">
        <PartThumbnail pdf={part} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{partLabel(part)}</span>
          <span className="block text-[13px] text-fg-subtle tabular-nums">{part.pageCount} 页</span>
        </span>
      </button>
      <IconButton label={`删除${partLabel(part)}声部`} onClick={() => removePartWithUndo(score, part)}><Trash2 /></IconButton>
    </div>
  );
}

export function ScoreDetailPage() {
  const { scoreId } = useParams<{ scoreId: string }>();
  const navigate = useNavigate();
  const { data: score, isPending, isError } = useScoreDetail(scoreId);
  const reorderParts = useReorderParts(scoreId!);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPart, setIsAddingPart] = useState(false);

  if (isPending) return <PageSpinner />;
  if (isError || !score) return <EmptyState icon={<ListMusic />} title="乐曲不存在" action={<Button onClick={() => navigate('/library')}>返回曲库</Button>} />;

  const reorder = (parts: PartView[]) => {
    queryClient.setQueryData<ScoreDetail>(scoreKey.detail(score.id), { ...score, parts });
    reorderParts.mutate(parts.map(part => part.id));
  };

  const deleteScore = () => {
    navigate('/library', { replace: true });
    removeScoreWithUndo(score);
  };

  return (
    <>
      <PageHeader
        backTo="/library"
        title={score.title}
        subtitle={[score.composer || '未填写作曲', `${score.bpm} BPM`, score.timeSignature].join(' · ')}
        actions={(
          <>
            <IconButton label="编辑" onClick={() => setIsEditing(true)}><Pencil /></IconButton>
            <Menu>
              <MenuTrigger asChild>
                <IconButton label="更多操作"><Ellipsis /></IconButton>
              </MenuTrigger>
              <MenuContent>
                <AddToSetlistMenu scoreId={score.id} excludeSetlistIds={score.setlists.map(setlist => setlist.id)} />
                <MenuSeparator />
                <MenuItem icon={<Trash2 />} tone="danger" onSelect={deleteScore}>删除乐曲</MenuItem>
              </MenuContent>
            </Menu>
          </>
        )}
      />

      {score.parts[0] && (
        <Button variant="primary" size="lg" className="mb-8 w-full sm:w-auto" onClick={() => navigate(`/view/${score.parts[0]!.id}`)}>
          <Play fill="currentColor" />
          开始阅读
        </Button>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">声部 <span className="text-fg-subtle tabular-nums">{score.parts.length}</span></h2>
          <Button size="sm" variant="ghost" className="text-score" onClick={() => setIsAddingPart(true)}><FilePlus2 />添加声部</Button>
        </div>
        {score.parts.length === 0
          ? <EmptyState className="py-8" icon={<FilePlus2 />} title="还没有声部" description="为这首乐曲添加一份 PDF 分谱。" action={<Button variant="primary" onClick={() => setIsAddingPart(true)}>添加声部</Button>} />
          : (
            <SortableList
              items={score.parts}
              getId={part => part.id}
              onReorder={reorder}
              renderItem={(part, _index, handle) => <PartRow score={score} part={part} dragHandle={handle} />}
            />
          )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[17px] font-semibold">所在曲目单</h2>
        {score.setlists.length === 0
          ? <p className="text-sm text-fg-muted">尚未加入任何曲目单，可在右上角「更多操作」中加入。</p>
          : (
            <div className="flex flex-wrap gap-2">
              {score.setlists.map(setlist => (
                <Link key={setlist.id} to={`/setlist/${setlist.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-setlist-soft px-3 py-1.5 text-sm font-medium text-setlist hover:brightness-95">
                  <ListMusic className="size-4" />
                  {setlist.name}
                </Link>
              ))}
            </div>
          )}
      </section>

      <EditScoreDialog score={score} open={isEditing} onOpenChange={setIsEditing} />
      <AddPartDialog score={score} open={isAddingPart} onOpenChange={setIsAddingPart} />
    </>
  );
}
