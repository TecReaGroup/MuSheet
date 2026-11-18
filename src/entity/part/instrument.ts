import type { Instrument, PartView } from '@contract/api';

export const INSTRUMENT_NAMES: Record<Instrument, string> = {
  vocal: '人声',
  keyboard: '键盘',
  guitar: '吉他',
  bass: '贝斯',
  drums: '鼓',
  custom: '自定义',
};

export function partLabel(part: Pick<PartView, 'instrument' | 'customLabel'>) {
  return part.customLabel ?? INSTRUMENT_NAMES[part.instrument];
}

export function isSameInstrument(a: Pick<PartView, 'instrument' | 'customLabel'>, b: Pick<PartView, 'instrument' | 'customLabel'>) {
  return a.instrument === b.instrument && a.customLabel === b.customLabel;
}
