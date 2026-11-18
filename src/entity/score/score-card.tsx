import type { ScoreSummary } from '@contract/api';
import type { MouseEvent, ReactNode } from 'react';
import { ListCard } from '@/shared/ui/list-card';
import { partLabel } from '../part/instrument';
import { PartThumbnail } from '../part/part-thumbnail';

interface ScoreCardProps {
  score: ScoreSummary;
  onOpen: () => void;
  actions?: ReactNode;
  onContextMenu?: (event: MouseEvent) => void;
}

export function describeParts(score: ScoreSummary) {
  if (score.parts.length === 0) return '暂无声部';
  if (score.parts.length <= 2) return score.parts.map(partLabel).join(' · ');
  return `${score.parts.length} 个声部`;
}

export function ScoreCard({ score, onOpen, actions, onContextMenu }: ScoreCardProps) {
  return (
    <ListCard
      leading={<PartThumbnail pdf={score.parts[0]} className="h-14 w-10.5" />}
      title={score.title}
      subtitle={score.composer || '未填写作曲'}
      meta={`${describeParts(score)} · ${score.bpm} BPM`}
      trailing={actions}
      onOpen={onOpen}
      onContextMenu={onContextMenu}
    />
  );
}
