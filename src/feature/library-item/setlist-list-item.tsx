import type { SetlistSummary } from '@contract/api';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { SetlistCard } from '@/entity/setlist/setlist-card';
import { SpaceLabel } from '@/entity/space/space-label';
import { SetlistActionsMenu } from './setlist-actions-menu';

/** Setlist row with the ⋯ actions menu, also opened by right-click; every setlist list shares it. */
export function SetlistListItem({ setlist }: { setlist: SetlistSummary }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <SetlistCard
      setlist={setlist}
      badge={<SpaceLabel space={setlist.space} />}
      onOpen={() => navigate(`/setlist/${setlist.id}`)}
      onContextMenu={event => { event.preventDefault(); setMenuOpen(true); }}
      actions={<SetlistActionsMenu setlist={setlist} open={menuOpen} onOpenChange={setMenuOpen} />}
    />
  );
}
