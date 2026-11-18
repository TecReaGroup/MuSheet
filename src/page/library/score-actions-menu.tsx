import type { ScoreSummary } from '@contract/api';
import { Ellipsis, Info, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { removeScoreWithUndo } from '@/entity/score/remove-score';
import { AddToSetlistMenu } from '@/feature/setlist-edit/add-to-setlist-menu';
import { IconButton } from '@/shared/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';

interface ScoreActionsMenuProps {
  score: ScoreSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Controlled so right-click on the card can open the same menu as the ⋯ button. */
export function ScoreActionsMenu({ score, open, onOpenChange }: ScoreActionsMenuProps) {
  const navigate = useNavigate();
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger asChild>
        <IconButton label="更多操作" className="size-9"><Ellipsis /></IconButton>
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Info />} onSelect={() => navigate(`/score/${score.id}`)}>详情与声部</MenuItem>
        <AddToSetlistMenu scoreId={score.id} />
        <MenuSeparator />
        <MenuItem icon={<Trash2 />} tone="danger" onSelect={() => removeScoreWithUndo(score)}>删除</MenuItem>
      </MenuContent>
    </Menu>
  );
}
