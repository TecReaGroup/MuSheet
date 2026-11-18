import { ListMusic, ListPlus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppendToSetlist, useSetlistList } from '@/entity/setlist/setlist-api';
import { MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger } from '@/shared/ui/menu';
import { useCreateSetlistDialogStore } from './create-setlist-dialog';

interface AddToSetlistMenuProps {
  scoreId: string;
  excludeSetlistIds?: string[];
}

/** Submenu for any score menu: append to an existing setlist or start a new one with this score. */
export function AddToSetlistMenu({ scoreId, excludeSetlistIds = [] }: AddToSetlistMenuProps) {
  const { data: setlists = [] } = useSetlistList({ sort: 'opened', order: 'desc' });
  const appendToSetlist = useAppendToSetlist();
  const openCreateDialog = useCreateSetlistDialogStore(state => state.open);
  const candidates = setlists.filter(setlist => !excludeSetlistIds.includes(setlist.id));

  return (
    <MenuSub>
      <MenuSubTrigger icon={<ListPlus />}>加入曲目单</MenuSubTrigger>
      <MenuSubContent>
        {candidates.map(setlist => (
          <MenuItem
            key={setlist.id}
            icon={<ListMusic />}
            onSelect={() => appendToSetlist.mutate({ setlistId: setlist.id, scoreId }, {
              onSuccess: () => toast.success(`已加入「${setlist.name}」`),
            })}
          >
            <span className="truncate">{setlist.name}</span>
          </MenuItem>
        ))}
        {candidates.length > 0 && <MenuSeparator />}
        <MenuItem icon={<Plus />} onSelect={() => openCreateDialog(scoreId)}>新建曲目单…</MenuItem>
      </MenuSubContent>
    </MenuSub>
  );
}
