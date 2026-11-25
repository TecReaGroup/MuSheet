import type { SetlistDetail } from '@contract/api';
import { useState } from 'react';
import { useScoreList } from '@/entity/score/score-api';
import { saveSetlistOrder } from '@/entity/setlist/setlist-change';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { PickList, toggleSelection } from '@/shared/ui/pick-list';
import { SearchField } from '@/shared/ui/search-field';
import { Spinner } from '@/shared/ui/spinner';

const SEARCH_DEBOUNCE_MS = 200;

const ADD_SCORES_TEXT = defineText({
  'zh-CN': {
    title: '添加乐曲',
    description: (setlistName: string) => `添加到「${setlistName}」末尾`,
    submitMany: (count: number) => `添加 ${count} 首`,
    searchPlaceholder: '搜索乐曲或作曲',
    noCandidates: '没有可添加的乐曲',
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
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { data: scores, isPending } = useScoreList({ space: setlist.space, query: debouncedQuery || undefined, sort: 'title', order: 'asc' });
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
      {isPending && <div className="flex justify-center py-8"><Spinner /></div>}
      {!isPending && candidates.length === 0 && <p className="py-8 text-center text-sm text-fg-muted">{text.noCandidates}</p>}
      <PickList
        items={candidates.map(score => ({ id: score.id, kind: 'score', title: score.title, subtitle: score.composer || commonText.noComposer }))}
        selectedIds={selectedIds}
        onToggle={toggle}
        tone="setlist"
      />
    </Dialog>
  );
}
