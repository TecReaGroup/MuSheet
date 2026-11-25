import type { ScoreSummary } from '@contract/api';
import type { MouseEvent, ReactNode } from 'react';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, readText, useText } from '@/shared/i18n/text';
import { IconTile } from '@/shared/ui/icon-tile';
import { ListCard } from '@/shared/ui/list-card';
import { partLabel } from '../part/instrument';

interface ScoreCardProps {
  score: ScoreSummary;
  onOpen: () => void;
  badge?: ReactNode;
  actions?: ReactNode;
  onContextMenu?: (event: MouseEvent) => void;
}

const SCORE_CARD_TEXT = defineText({
  'zh-CN': { noParts: '暂无声部' },
  en: { noParts: 'No parts yet' },
});

/** Reads the locale at call time; render it inside a component that subscribes via `useText`. */
export function describeParts(score: ScoreSummary) {
  if (score.parts.length === 0) return readText(SCORE_CARD_TEXT).noParts;
  if (score.parts.length <= 2) return score.parts.map(partLabel).join(' · ');
  return readText(COMMON_TEXT).partCount(score.parts.length);
}

export function ScoreCard({ score, onOpen, badge, actions, onContextMenu }: ScoreCardProps) {
  const text = useText(COMMON_TEXT);
  return (
    <ListCard
      leading={<IconTile kind="score" />}
      title={score.title}
      badge={badge}
      subtitle={score.composer || text.noComposer}
      // The badge takes the parts summary's slot so mixed-library rows stay one line.
      meta={badge ? `${score.bpm} BPM` : `${describeParts(score)} · ${score.bpm} BPM`}
      trailing={actions}
      onOpen={onOpen}
      onContextMenu={onContextMenu}
    />
  );
}
