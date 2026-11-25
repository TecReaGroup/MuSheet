import type { Instrument, PartView } from '@contract/api';
import { defineText, readText } from '@/shared/i18n/text';

const INSTRUMENT_TEXT = defineText<Record<Instrument, string>>({
  'zh-CN': { vocal: '人声', keyboard: '键盘', guitar: '吉他', bass: '贝斯', drums: '鼓', custom: '自定义' },
  en: { vocal: 'Vocal', keyboard: 'Keyboard', guitar: 'Guitar', bass: 'Bass', drums: 'Drums', custom: 'Custom' },
});

/** Not reactive on its own: callers render inside components that already subscribe via `useText`. */
export function instrumentName(instrument: Instrument) {
  return readText(INSTRUMENT_TEXT)[instrument];
}

export function partLabel(part: Pick<PartView, 'instrument' | 'customLabel'>) {
  return part.customLabel ?? instrumentName(part.instrument);
}

export function isSameInstrument(a: Pick<PartView, 'instrument' | 'customLabel'>, b: Pick<PartView, 'instrument' | 'customLabel'>) {
  return a.instrument === b.instrument && a.customLabel === b.customLabel;
}
