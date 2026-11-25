import type { Space } from '@contract/api';
import { defineText, useText } from '@/shared/i18n/text';

export const SPACE_TEXT = defineText<Record<Space, string>>({
  'zh-CN': { personal: '个人', team: 'Team' },
  en: { personal: 'Personal', team: 'Team' },
});

/** Names which library an item comes from, for views that mix both. */
export function SpaceLabel({ space }: { space: Space }) {
  return <>{useText(SPACE_TEXT)[space]}</>;
}
