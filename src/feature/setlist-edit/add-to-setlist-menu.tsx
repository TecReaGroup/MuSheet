import type { ScoreSummary } from '@contract/api';
import { ListMusic, ListPlus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppendToSetlist, useSetlistList } from '@/entity/setlist/setlist-api';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger } from '@/shared/ui/menu';
import { useCreateSetlistDialogStore } from './create-setlist-dialog';

const ADD_TO_SETLIST_TEXT = defineText({
  'zh-CN': {
    addToSetlist: '加入谱单',
    newSetlist: '新建谱单…',
    added: (setlistName: string) => `已加入「${setlistName}」`,
  },
  en: {
    addToSetlist: 'Add to setlist',
    newSetlist: 'New setlist…',
    added: (setlistName: string) => `Added to "${setlistName}"`,
  },
});

interface AddToSetlistMenuProps {
  score: Pick<ScoreSummary, 'id' | 'space'>;
  excludeSetlistIds?: string[];
}

/** Submenu for any score menu: append to an existing setlist or start a new one with this score. */
export function AddToSetlistMenu({ score, excludeSetlistIds = [] }: AddToSetlistMenuProps) {
  // Setlists only hold scores from their own library.
  const { data: setlists = [] } = useSetlistList({ space: score.space, sort: 'opened', order: 'desc' });
  const appendToSetlist = useAppendToSetlist();
  const text = useText(ADD_TO_SETLIST_TEXT);
  const openCreateDialog = useCreateSetlistDialogStore(state => state.open);
  const candidates = setlists.filter(setlist => !excludeSetlistIds.includes(setlist.id));

  return (
    <MenuSub>
      <MenuSubTrigger icon={<ListPlus />}>{text.addToSetlist}</MenuSubTrigger>
      <MenuSubContent>
        {candidates.map(setlist => (
          <MenuItem
            key={setlist.id}
            icon={<ListMusic />}
            onSelect={() => appendToSetlist.mutate({ setlistId: setlist.id, scoreId: score.id }, {
              onSuccess: () => toast.success(readText(ADD_TO_SETLIST_TEXT).added(setlist.name)),
            })}
          >
            <span className="truncate">{setlist.name}</span>
          </MenuItem>
        ))}
        {candidates.length > 0 && <MenuSeparator />}
        <MenuItem icon={<Plus />} onSelect={() => openCreateDialog(score.space, score.id)}>{text.newSetlist}</MenuItem>
      </MenuSubContent>
    </MenuSub>
  );
}
