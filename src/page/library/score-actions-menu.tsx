import type { ScoreSummary } from '@contract/api';
import { Ellipsis, Info, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { removeScoreWithUndo } from '@/entity/score/remove-score';
import { AddToSetlistMenu } from '@/feature/setlist-edit/add-to-setlist-menu';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { IconButton } from '@/shared/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';
import { LIBRARY_TEXT } from './library-text';

interface ScoreActionsMenuProps {
  score: ScoreSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Controlled so right-click on the card can open the same menu as the ⋯ button. */
export function ScoreActionsMenu({ score, open, onOpenChange }: ScoreActionsMenuProps) {
  const navigate = useNavigate();
  const text = useText(LIBRARY_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger asChild>
        <IconButton label={commonText.moreActions} className="size-9"><Ellipsis /></IconButton>
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Info />} onSelect={() => navigate(`/score/${score.id}`)}>{text.scoreDetails}</MenuItem>
        <AddToSetlistMenu score={score} />
        <MenuSeparator />
        <MenuItem icon={<Trash2 />} tone="danger" onSelect={() => removeScoreWithUndo(score)}>{commonText.delete}</MenuItem>
      </MenuContent>
    </Menu>
  );
}
