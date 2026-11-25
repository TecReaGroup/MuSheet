import type { SetlistDetail } from '@contract/api';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useScoreList } from '@/entity/score/score-api';
import { saveSetlistOrder } from '@/entity/setlist/setlist-change';
import { cn } from '@/shared/lib/class-name';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { IconTile } from '@/shared/ui/icon-tile';
import { SearchField } from '@/shared/ui/search-field';
import { Spinner } from '@/shared/ui/spinner';

const SEARCH_DEBOUNCE_MS = 200;

interface AddScoresDialogProps {
  setlist: SetlistDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddScoresDialog({ setlist, open, onOpenChange }: AddScoresDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { data: scores, isPending } = useScoreList({ query: debouncedQuery || undefined, sort: 'title', order: 'asc' });
  const memberIds = new Set(setlist.scores.map(score => score.id));
  const candidates = (scores ?? []).filter(score => !memberIds.has(score.id));

  const toggle = (scoreId: string) =>
    setSelectedIds(current => (current.includes(scoreId) ? current.filter(id => id !== scoreId) : [...current, scoreId]));

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
      title="添加乐曲"
      description={`添加到「${setlist.name}」末尾`}
      footer={(
        <>
          <Button variant="ghost" onClick={close}>取消</Button>
          <Button variant="setlist" disabled={selectedIds.length === 0} onClick={submit}>
            {selectedIds.length > 0 ? `添加 ${selectedIds.length} 首` : '添加'}
          </Button>
        </>
      )}
    >
      <SearchField value={query} onChange={setQuery} placeholder="搜索乐曲或作曲" className="sticky top-0 z-10 mb-3" />
      {isPending && <div className="flex justify-center py-8"><Spinner /></div>}
      {!isPending && candidates.length === 0 && <p className="py-8 text-center text-sm text-fg-muted">没有可添加的乐曲</p>}
      <ul className="space-y-1 pb-2">
        {candidates.map(score => {
          const selected = selectedIds.includes(score.id);
          return (
            <li key={score.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(score.id)}
                className={cn('flex w-full items-center gap-3 rounded-card p-2 text-left transition-colors', selected ? 'bg-setlist-soft' : 'hover:bg-muted')}
              >
                <IconTile kind="score" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{score.title}</span>
                  <span className="block truncate text-[13px] text-fg-muted">{score.composer || '未填写作曲'}</span>
                </span>
                <span className={cn('flex size-6 items-center justify-center rounded-full border-2', selected ? 'border-setlist bg-setlist text-white' : 'border-border')}>
                  {selected && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
