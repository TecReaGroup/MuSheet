import type { ScoreSummary } from '@contract/api';
import { Ellipsis, Info, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { removeScoreWithUndo } from '@/entity/score/remove-score';
import { AddToSetlistMenu } from '@/feature/setlist-edit/add-to-setlist-menu';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { IconButton } from '@/shared/ui/button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';
import { LIBRARY_ITEM_TEXT } from './library-item-text';

interface ScoreActionsMenuProps {
  score: ScoreSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** ⋯ opens the detail page; the menu is controlled so right-click on the card opens it. */
export function ScoreActionsMenu({ score, open, onOpenChange }: ScoreActionsMenuProps) {
  const navigate = useNavigate();
  const text = useText(LIBRARY_ITEM_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <IconButton label={text.scoreDetails} className="size-9 text-fg-quiet" onClick={() => navigate(`/score/${score.id}`)}><Ellipsis /></IconButton>
      {/* NOTE: The ⋯ button navigates, so this inert overlay only anchors the right-click menu at the same spot. */}
      <MenuTrigger asChild>
        <span aria-hidden className="pointer-events-none absolute inset-0" />
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
