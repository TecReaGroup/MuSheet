import type { ScoreSummary } from '@contract/api';
import { invalidateLibrary, queryClient } from '@/shared/api/query-client';
import { runUndoable } from '@/shared/lib/undoable';
import { deleteScore, scoreKey } from './score-api';

export function removeScoreWithUndo(score: ScoreSummary) {
  runUndoable({
    message: `已删除《${score.title}》`,
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
