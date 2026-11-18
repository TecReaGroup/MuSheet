import type { SetlistSummary } from '@contract/api';
import type { MouseEvent, ReactNode } from 'react';
import { IconTile } from '@/shared/ui/icon-tile';
import { ListCard } from '@/shared/ui/list-card';

interface SetlistCardProps {
  setlist: SetlistSummary;
  onOpen: () => void;
  actions?: ReactNode;
  onContextMenu?: (event: MouseEvent) => void;
}

export function SetlistCard({ setlist, onOpen, actions, onContextMenu }: SetlistCardProps) {
  return (
    <ListCard
      leading={<IconTile kind="setlist" />}
      title={setlist.name}
      subtitle={setlist.description || undefined}
      meta={`${setlist.scoreCount} 首乐曲`}
      trailing={actions}
      onOpen={onOpen}
      onContextMenu={onContextMenu}
    />
  );
}
