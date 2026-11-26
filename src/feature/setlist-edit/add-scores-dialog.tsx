import type { SetlistDetail } from '@contract/api';
import { useState } from 'react';
import { useScoreList } from '@/entity/score/score-api';
import { saveSetlistOrder } from '@/entity/setlist/setlist-change';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { useSearchQuery } from '@/shared/lib/use-search-query';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { PickList, PickListSkeleton, toggleSelection } from '@/shared/ui/pick-list';
import { SearchField } from '@/shared/ui/search-field';

const ADD_SCORES_TEXT = defineText({
  'zh-CN': {
    title: '添加乐谱',
    description: (setlistName: string) => `添加到「${setlistName}」末尾`,
    submitMany: (count: number) => `添加 ${count} 首`,
    searchPlaceholder: '搜索乐谱或作曲',
    noCandidates: '没有可添加的乐谱',
  },
  en: {
    title: 'Add scores',
    description: (setlistName: string) => `Append to the end of "${setlistName}"`,
    submitMany: (count: number) => `Add ${count}`,
    searchPlaceholder: 'Search scores or composers',
    noCandidates: 'No scores to add',
  },
});

interface AddScoresDialogProps {
  setlist: SetlistDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddScoresDialog({ setlist, open, onOpenChange }: AddScoresDialogProps) {
  const text = useText(ADD_SCORES_TEXT);
  const commonText = useText(COMMON_TEXT);
  const { query, setQuery, settledQuery } = useSearchQuery();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data: scores, isPending } = useScoreList({ space: setlist.space, query: settledQuery || undefined, sort: 'title', order: 'asc' });
  const memberIds = new Set(setlist.scores.map(score => score.id));
  const candidates = (scores ?? []).filter(score => !memberIds.has(score.id));

  const toggle = (scoreId: string) => setSelectedIds(current => toggleSelection(current, scoreId));

  const close = () => {
    onOpenChange(false);
    setSelectedIds([]);
    setQuery('');
  };

  const submit = () => {
    const added = (scores ?? []).filter(score => selectedIds.includes(score.id));
    void saveSetlistOrder(setlist, [...setlist.scores, ...added]);
    close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => (next ? onOpenChange(true) : close())}
      title={text.title}
      description={text.description(setlist.name)}
      footer={(
        <>
          <Button variant="ghost" onClick={close}>{commonText.cancel}</Button>
          <Button variant="setlist" disabled={selectedIds.length === 0} onClick={submit}>
            {selectedIds.length > 0 ? text.submitMany(selectedIds.length) : commonText.add}
          </Button>
        </>
      )}
    >
      <SearchField value={query} onChange={setQuery} placeholder={text.searchPlaceholder} className="sticky top-0 z-10 mb-3" />
      {isPending ? <PickListSkeleton /> : (
        <PickList
          items={candidates.map(score => ({ id: score.id, kind: 'score', title: score.title, subtitle: score.composer || commonText.noComposer }))}
          selectedIds={selectedIds}
          onToggle={toggle}
          tone="setlist"
          emptyMessage={text.noCandidates}
        />
      )}
    </Dialog>
  );
}
