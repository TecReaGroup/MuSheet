import { useState } from 'react';
import { toast } from 'sonner';
import { copyScoresToTeam, useScoreList } from '@/entity/score/score-api';
import { copySetlistsToTeam, useSetlistList } from '@/entity/setlist/setlist-api';
import { describeError } from '@/shared/api/http-client';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { log, serializeError } from '@/shared/lib/logger';
import { useSearchQuery } from '@/shared/lib/use-search-query';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { PickList, PickListSkeleton, toggleSelection, type PickItem } from '@/shared/ui/pick-list';
import { SearchField } from '@/shared/ui/search-field';

const TEAM_COPY_TEXT = defineText({
  'zh-CN': {
    scoreTitle: '从我的曲库导入乐曲',
    scoreDescription: '把选中的乐曲复制一份到 Team。之后两边各自修改，互不影响；个人标注不会带过去。',
    scoreSearch: '搜索我的乐曲',
    scoreEmpty: '你的曲库里还没有乐曲',
    scoreCopied: (count: number) => `已导入 ${count} 首乐曲到 Team`,
    setlistTitle: '从我的曲库导入曲目单',
    setlistDescription: '曲目单和其中的乐曲会一起复制到 Team，之后两边各自修改，互不影响。',
    setlistSearch: '搜索我的曲目单',
    setlistEmpty: '你的曲库里还没有曲目单',
    setlistCopied: (count: number) => `已导入 ${count} 个曲目单到 Team`,
    submit: '导入',
    submitMany: (count: number) => `导入 ${count} 项`,
  },
  en: {
    scoreTitle: 'Import scores from my library',
    scoreDescription: 'Copies the selected scores into Team. The copies are edited independently; personal annotations stay private.',
    scoreSearch: 'Search my scores',
    scoreEmpty: 'Your library has no scores yet',
    scoreCopied: (count: number) => (count === 1 ? 'Imported 1 score into Team' : `Imported ${count} scores into Team`),
    setlistTitle: 'Import setlists from my library',
    setlistDescription: 'Setlists are copied into Team together with their scores; the copies are edited independently.',
    setlistSearch: 'Search my setlists',
    setlistEmpty: 'Your library has no setlists yet',
    setlistCopied: (count: number) => (count === 1 ? 'Imported 1 setlist into Team' : `Imported ${count} setlists into Team`),
    submit: 'Import',
    submitMany: (count: number) => `Import ${count}`,
  },
});

interface CopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CopyDialogFrameProps extends CopyDialogProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  emptyMessage: string;
  tone: 'score' | 'setlist';
  /** Called with the debounced search text; returns the candidates to pick from. */
  useCandidates: (query: string | undefined) => { items: PickItem[]; isPending: boolean };
  /** Performs the copy and returns the toast to show. */
  copy: (ids: string[]) => Promise<string>;
}

function CopyDialogFrame({ open, onOpenChange, title, description, searchPlaceholder, emptyMessage, tone, useCandidates, copy }: CopyDialogFrameProps) {
  const text = useText(TEAM_COPY_TEXT);
  const commonText = useText(COMMON_TEXT);
  const { query, setQuery, settledQuery } = useSearchQuery();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const { items, isPending } = useCandidates(settledQuery || undefined);

  const close = () => {
    onOpenChange(false);
    setSelectedIds([]);
    setQuery('');
  };

  const submit = async () => {
    setIsCopying(true);
    try {
      toast.success(await copy(selectedIds));
      close();
    } catch (error) {
      log('warn', 'TeamShare', 'Copy to team failed', serializeError(error));
      toast.error(describeError(error));
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => (next ? onOpenChange(true) : close())}
      title={title}
      description={description}
      footer={(
        <>
          <Button variant="ghost" onClick={close}>{commonText.cancel}</Button>
          <Button variant={tone === 'setlist' ? 'setlist' : 'primary'} disabled={selectedIds.length === 0 || isCopying} onClick={() => void submit()}>
            {selectedIds.length > 1 ? text.submitMany(selectedIds.length) : text.submit}
          </Button>
        </>
      )}
    >
      <SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} className="sticky top-0 z-10 mb-3" />
      {isPending
        ? <PickListSkeleton />
        : <PickList items={items} selectedIds={selectedIds} onToggle={id => setSelectedIds(current => toggleSelection(current, id))} tone={tone} emptyMessage={emptyMessage} />}
    </Dialog>
  );
}

function usePersonalScoreItems(query: string | undefined) {
  const commonText = useText(COMMON_TEXT);
  const { data = [], isPending } = useScoreList({ space: 'personal', query, sort: 'title', order: 'asc' });
  const items = data.map((score): PickItem => ({ id: score.id, kind: 'score', title: score.title, subtitle: score.composer || commonText.noComposer }));
  return { items, isPending };
}

function usePersonalSetlistItems(query: string | undefined) {
  const commonText = useText(COMMON_TEXT);
  const { data = [], isPending } = useSetlistList({ space: 'personal', query, sort: 'title', order: 'asc' });
  const items = data.map((setlist): PickItem => ({ id: setlist.id, kind: 'setlist', title: setlist.name, subtitle: commonText.scoreCount(setlist.scoreCount) }));
  return { items, isPending };
}

export function TeamScoreCopyDialog(props: CopyDialogProps) {
  const text = useText(TEAM_COPY_TEXT);
  return (
    <CopyDialogFrame
      {...props}
      title={text.scoreTitle}
      description={text.scoreDescription}
      searchPlaceholder={text.scoreSearch}
      emptyMessage={text.scoreEmpty}
      tone="score"
      useCandidates={usePersonalScoreItems}
      copy={async ids => readText(TEAM_COPY_TEXT).scoreCopied((await copyScoresToTeam(ids)).length)}
    />
  );
}

export function TeamSetlistCopyDialog(props: CopyDialogProps) {
  const text = useText(TEAM_COPY_TEXT);
  return (
    <CopyDialogFrame
      {...props}
      title={text.setlistTitle}
      description={text.setlistDescription}
      searchPlaceholder={text.setlistSearch}
      emptyMessage={text.setlistEmpty}
      tone="setlist"
      useCandidates={usePersonalSetlistItems}
      copy={async ids => readText(TEAM_COPY_TEXT).setlistCopied((await copySetlistsToTeam(ids)).length)}
    />
  );
}
