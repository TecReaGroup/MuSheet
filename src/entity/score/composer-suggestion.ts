import type { ScoreSummary } from '@contract/api';
import { useMemo } from 'react';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import type { Suggestion } from '@/shared/ui/suggestion-input';

/** Every composer already in the library, with how many scores each one has. */
export function useComposerSuggestions(scores: ScoreSummary[]): Suggestion[] {
  const commonText = useText(COMMON_TEXT);
  return useMemo(() => {
    const countByComposer = new Map<string, number>();
    for (const { composer } of scores) {
      if (composer) countByComposer.set(composer, (countByComposer.get(composer) ?? 0) + 1);
    }
    return [...countByComposer].map(([composer, count]) => ({ value: composer, meta: commonText.scoreCount(count) }));
  }, [scores, commonText]);
}
