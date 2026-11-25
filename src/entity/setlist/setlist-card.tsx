import type { SetlistSummary } from '@contract/api';
import type { MouseEvent, ReactNode } from 'react';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { IconTile } from '@/shared/ui/icon-tile';
import { ListCard } from '@/shared/ui/list-card';

interface SetlistCardProps {
  setlist: SetlistSummary;
  onOpen: () => void;
  badge?: ReactNode;
  actions?: ReactNode;
  onContextMenu?: (event: MouseEvent) => void;
}

export function SetlistCard({ setlist, onOpen, badge, actions, onContextMenu }: SetlistCardProps) {
  const text = useText(COMMON_TEXT);
  return (
    <ListCard
      leading={<IconTile kind="setlist" />}
      title={setlist.name}
      badge={badge}
      subtitle={setlist.description || undefined}
      meta={text.scoreCount(setlist.scoreCount)}
      trailing={actions}
      onOpen={onOpen}
      onContextMenu={onContextMenu}
    />
  );
}
