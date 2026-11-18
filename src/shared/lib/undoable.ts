import { toast } from 'sonner';
import { describeError } from '../api/http-client';
import { log, serializeError } from './logger';

const UNDO_WINDOW_MS = 5000;

interface UndoableAction {
  message: string;
  /** Applied immediately (usually an optimistic cache edit). */
  apply: () => void;
  /** Runs after the undo window closes without an undo. */
  commit: () => Promise<unknown>;
  /** Restores the state `apply` changed; also used when the commit fails. */
  revert: () => void;
}

/**
 * Destructive actions apply instantly and offer "撤销" instead of a confirm dialog.
 * If the page is closed inside the window the action is simply never committed — the safe direction.
 */
export function runUndoable({ message, apply, commit, revert }: UndoableAction) {
  let undone = false;
  apply();
  const timer = window.setTimeout(() => {
    if (undone) return;
    commit().catch(error => {
      log('error', 'Undoable', 'Deferred commit failed', serializeError(error));
      toast.error(describeError(error));
      revert();
    });
  }, UNDO_WINDOW_MS);
  toast(message, {
    duration: UNDO_WINDOW_MS,
    action: {
      label: '撤销',
      onClick: () => {
        undone = true;
        window.clearTimeout(timer);
        revert();
      },
    },
  });
}
