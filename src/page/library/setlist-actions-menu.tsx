import type { SetlistSummary } from '@contract/api';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { removeSetlistWithUndo } from '@/entity/setlist/setlist-change';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { IconButton } from '@/shared/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';
import { LIBRARY_TEXT } from './library-text';

interface SetlistActionsMenuProps {
  setlist: SetlistSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetlistActionsMenu({ setlist, open, onOpenChange }: SetlistActionsMenuProps) {
  const navigate = useNavigate();
  const text = useText(LIBRARY_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger asChild>
        <IconButton label={commonText.moreActions} className="size-9"><Ellipsis /></IconButton>
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Pencil />} onSelect={() => navigate(`/setlist/${setlist.id}`)}>{text.openAndEdit}</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Trash2 />} tone="danger" onSelect={() => removeSetlistWithUndo(setlist)}>{commonText.delete}</MenuItem>
      </MenuContent>
    </Menu>
  );
}
