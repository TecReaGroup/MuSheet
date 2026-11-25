import type { Space } from '@contract/api';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { create } from 'zustand';
import { useAppendToSetlist, useCreateSetlist } from '@/entity/setlist/setlist-api';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { SetlistFormDialog } from './setlist-form-dialog';

interface CreateSetlistDialogState {
  isOpen: boolean;
  space: Space;
  /** When set, the new setlist starts with this score instead of opening the empty setlist page. */
  initialScoreId: string | null;
  open: (space: Space, initialScoreId?: string) => void;
  close: () => void;
}

export const useCreateSetlistDialogStore = create<CreateSetlistDialogState>()(set => ({
  isOpen: false,
  space: 'personal',
  initialScoreId: null,
  open: (space, initialScoreId) => set({ isOpen: true, space, initialScoreId: initialScoreId ?? null }),
  close: () => set({ isOpen: false }),
}));

const EMPTY_FORM = { name: '', description: '' };

const CREATE_SETLIST_TEXT = defineText({
  'zh-CN': {
    title: '新建曲目单',
    submit: '创建',
    createdWithScore: (setlistName: string) => `已创建「${setlistName}」并加入乐曲`,
  },
  en: {
    title: 'New setlist',
    submit: 'Create',
    createdWithScore: (setlistName: string) => `Created "${setlistName}" and added the score`,
  },
});

/** Mounted once in the app shell so menus (which unmount on close) can open it. */
export function CreateSetlistDialog() {
  const { isOpen, space, initialScoreId, close } = useCreateSetlistDialogStore();
  const createSetlist = useCreateSetlist();
  const appendToSetlist = useAppendToSetlist();
  const navigate = useNavigate();
  const text = useText(CREATE_SETLIST_TEXT);

  return (
    <SetlistFormDialog
      open={isOpen}
      onOpenChange={open => !open && close()}
      title={text.title}
      submitLabel={text.submit}
      initial={EMPTY_FORM}
      isSubmitting={createSetlist.isPending}
      onSubmit={values => createSetlist.mutate({ space, ...values }, {
        onSuccess: setlist => {
          close();
          if (initialScoreId) {
            appendToSetlist.mutate({ setlistId: setlist.id, scoreId: initialScoreId }, {
              onSuccess: () => toast.success(readText(CREATE_SETLIST_TEXT).createdWithScore(setlist.name)),
            });
          } else {
            navigate(`/setlist/${setlist.id}`);
          }
        },
      })}
    />
  );
}
