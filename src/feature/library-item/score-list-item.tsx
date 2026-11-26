import type { ScoreSummary } from '@contract/api';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { scoreOpenPath } from '@/entity/score/open-score';
import { ScoreCard } from '@/entity/score/score-card';
import { SpaceLabel } from '@/entity/space/space-label';
import { ScoreActionsMenu } from './score-actions-menu';

/** Score row with the ⋯ actions menu, also opened by right-click; every score list shares it. */
export function ScoreListItem({ score }: { score: ScoreSummary }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <ScoreCard
      score={score}
      badge={<SpaceLabel space={score.space} />}
      onOpen={() => navigate(scoreOpenPath(score))}
      onContextMenu={event => { event.preventDefault(); setMenuOpen(true); }}
      actions={<ScoreActionsMenu score={score} open={menuOpen} onOpenChange={setMenuOpen} />}
    />
  );
}
