import type { SetlistSummary } from '@contract/api';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { removeSetlistWithUndo } from '@/entity/setlist/setlist-change';
import { IconButton } from '@/shared/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';

interface SetlistActionsMenuProps {
  setlist: SetlistSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetlistActionsMenu({ setlist, open, onOpenChange }: SetlistActionsMenuProps) {
  const navigate = useNavigate();
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger asChild>
        <IconButton label="更多操作" className="size-9"><Ellipsis /></IconButton>
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Pencil />} onSelect={() => navigate(`/setlist/${setlist.id}`)}>打开与编辑</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Trash2 />} tone="danger" onSelect={() => removeSetlistWithUndo(setlist)}>删除</MenuItem>
      </MenuContent>
    </Menu>
  );
}
