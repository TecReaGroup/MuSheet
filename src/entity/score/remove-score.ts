import type { ScoreSummary } from '@contract/api';
import { invalidateLibrary, queryClient } from '@/shared/api/query-client';
import { defineText, readText } from '@/shared/i18n/text';
import { runUndoable } from '@/shared/lib/undoable';
import { deleteScore, scoreKey } from './score-api';

const REMOVE_SCORE_TEXT = defineText({
  'zh-CN': { removed: (title: string) => `已删除《${title}》` },
  en: { removed: (title: string) => `Deleted "${title}"` },
});

export function removeScoreWithUndo(score: ScoreSummary) {
  runUndoable({
    message: readText(REMOVE_SCORE_TEXT).removed(score.title),
    apply: () => {
      queryClient.setQueriesData<ScoreSummary[]>({ queryKey: scoreKey.lists }, list => list?.filter(item => item.id !== score.id));
    },
    commit: async () => {
      await deleteScore(score.id);
      await invalidateLibrary();
    },
    revert: () => void invalidateLibrary(),
  });
}
