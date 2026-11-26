import type { SetlistDetail, SetlistSummary } from '@contract/api';
import { toast } from 'sonner';
import { describeError } from '@/shared/api/http-client';
import { invalidateLibrary, queryClient } from '@/shared/api/query-client';
import { defineText, readText } from '@/shared/i18n/text';
import { log, serializeError } from '@/shared/lib/logger';
import { runUndoable } from '@/shared/lib/undoable';
import { deleteSetlist, replaceSetlistItems, setlistKey } from './setlist-api';

const SETLIST_CHANGE_TEXT = defineText({
  'zh-CN': {
    removed: (name: string) => `已删除谱单「${name}」`,
    scoreRemoved: (title: string) => `已从谱单移除《${title}》`,
  },
  en: {
    removed: (name: string) => `Deleted setlist "${name}"`,
    scoreRemoved: (title: string) => `Removed "${title}" from the setlist`,
  },
});

export function removeSetlistWithUndo(setlist: SetlistSummary) {
  runUndoable({
    message: readText(SETLIST_CHANGE_TEXT).removed(setlist.name),
    apply: () => {
      queryClient.setQueriesData<SetlistSummary[]>({ queryKey: setlistKey.lists }, list => list?.filter(item => item.id !== setlist.id));
    },
    commit: async () => {
      await deleteSetlist(setlist.id);
      await invalidateLibrary();
    },
    revert: () => void invalidateLibrary(),
  });
}

/** Optimistically writes a new score order (reorder or removal) and persists the whole list. */
export async function saveSetlistOrder(setlist: SetlistDetail, scores: SetlistDetail['scores']) {
  queryClient.setQueryData<SetlistDetail>(setlistKey.detail(setlist.id), { ...setlist, scores, scoreCount: scores.length });
  try {
    await replaceSetlistItems(setlist.id, scores.map(score => score.id));
  } catch (error) {
    log('warn', 'Setlist', 'Saving order failed', serializeError(error));
    toast.error(describeError(error));
  } finally {
    await invalidateLibrary();
  }
}

export function removeFromSetlistWithUndo(setlist: SetlistDetail, scoreId: string) {
  const remaining = setlist.scores.filter(score => score.id !== scoreId);
  const removed = setlist.scores.find(score => score.id === scoreId);
  runUndoable({
    message: readText(SETLIST_CHANGE_TEXT).scoreRemoved(removed?.title ?? ''),
    apply: () => queryClient.setQueryData<SetlistDetail>(setlistKey.detail(setlist.id), { ...setlist, scores: remaining, scoreCount: remaining.length }),
    commit: async () => {
      await replaceSetlistItems(setlist.id, remaining.map(score => score.id));
      await invalidateLibrary();
    },
    revert: () => queryClient.setQueryData<SetlistDetail>(setlistKey.detail(setlist.id), setlist),
  });
}
