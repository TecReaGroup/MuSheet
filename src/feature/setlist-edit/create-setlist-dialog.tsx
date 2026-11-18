import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { create } from 'zustand';
import { useAppendToSetlist, useCreateSetlist } from '@/entity/setlist/setlist-api';
import { SetlistFormDialog } from './setlist-form-dialog';

interface CreateSetlistDialogState {
  isOpen: boolean;
  /** When set, the new setlist starts with this score instead of opening the empty setlist page. */
  initialScoreId: string | null;
  open: (initialScoreId?: string) => void;
  close: () => void;
}

export const useCreateSetlistDialogStore = create<CreateSetlistDialogState>()(set => ({
  isOpen: false,
  initialScoreId: null,
  open: initialScoreId => set({ isOpen: true, initialScoreId: initialScoreId ?? null }),
  close: () => set({ isOpen: false }),
}));

const EMPTY_FORM = { name: '', description: '' };

/** Mounted once in the app shell so menus (which unmount on close) can open it. */
export function CreateSetlistDialog() {
  const { isOpen, initialScoreId, close } = useCreateSetlistDialogStore();
  const createSetlist = useCreateSetlist();
  const appendToSetlist = useAppendToSetlist();
  const navigate = useNavigate();

  return (
    <SetlistFormDialog
      open={isOpen}
      onOpenChange={open => !open && close()}
      title="新建曲目单"
      submitLabel="创建"
      initial={EMPTY_FORM}
      isSubmitting={createSetlist.isPending}
      onSubmit={values => createSetlist.mutate(values, {
        onSuccess: setlist => {
          close();
          if (initialScoreId) {
            appendToSetlist.mutate({ setlistId: setlist.id, scoreId: initialScoreId }, {
              onSuccess: () => toast.success(`已创建「${setlist.name}」并加入乐曲`),
            });
          } else {
            navigate(`/setlist/${setlist.id}`);
          }
        },
      })}
    />
  );
}
