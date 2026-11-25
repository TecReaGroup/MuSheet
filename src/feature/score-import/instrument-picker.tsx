import { INSTRUMENTS, type Instrument } from '@contract/api';
import { instrumentName } from '@/entity/part/instrument';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { readStored, writeStored } from '@/shared/lib/local-storage';
import { Field, Select, TextInput } from '@/shared/ui/form-field';

const LAST_INSTRUMENT_KEY = 'musheet.last-instrument';

const PICKER_TEXT = defineText({
  'zh-CN': { customName: '声部名称', customPlaceholder: '如：小号' },
  en: { customName: 'Part name', customPlaceholder: 'e.g. Trumpet' },
});

export interface InstrumentChoice {
  instrument: Instrument;
  customLabel: string;
}

export function lastInstrumentChoice(): InstrumentChoice {
  return readStored<InstrumentChoice>(LAST_INSTRUMENT_KEY, { instrument: 'keyboard', customLabel: '' });
}

export function rememberInstrumentChoice(choice: InstrumentChoice) {
  writeStored(LAST_INSTRUMENT_KEY, choice);
}

export function toPartSelection(choice: InstrumentChoice) {
  return {
    instrument: choice.instrument,
    customLabel: choice.instrument === 'custom' ? choice.customLabel.trim() : null,
  };
}

export function isChoiceComplete(choice: InstrumentChoice) {
  return choice.instrument !== 'custom' || choice.customLabel.trim().length > 0;
}

interface InstrumentPickerProps {
  value: InstrumentChoice;
  onChange: (value: InstrumentChoice) => void;
  /** Instruments already present on the score; shown but not selectable. */
  takenInstruments?: Instrument[];
}

export function InstrumentPicker({ value, onChange, takenInstruments = [] }: InstrumentPickerProps) {
  const text = useText(PICKER_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <div className="flex gap-2">
      <Field label={commonText.part} className="flex-1">
        <Select value={value.instrument} onChange={event => onChange({ ...value, instrument: event.target.value as Instrument })}>
          {INSTRUMENTS.map(instrument => (
            <option key={instrument} value={instrument} disabled={instrument !== 'custom' && takenInstruments.includes(instrument)}>
              {instrumentName(instrument)}
            </option>
          ))}
        </Select>
      </Field>
      {value.instrument === 'custom' && (
        <Field label={text.customName} className="flex-1">
          <TextInput
            value={value.customLabel}
            maxLength={40}
            placeholder={text.customPlaceholder}
            onChange={event => onChange({ ...value, customLabel: event.target.value })}
          />
        </Field>
      )}
    </div>
  );
}
