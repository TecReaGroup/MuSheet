import { INSTRUMENTS, type Instrument } from '@contract/api';
import { INSTRUMENT_NAMES } from '@/entity/part/instrument';
import { readStored, writeStored } from '@/shared/lib/local-storage';
import { Field, Select, TextInput } from '@/shared/ui/form-field';

const LAST_INSTRUMENT_KEY = 'musheet.last-instrument';

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
  return (
    <div className="flex gap-2">
      <Field label="声部" className="flex-1">
        <Select value={value.instrument} onChange={event => onChange({ ...value, instrument: event.target.value as Instrument })}>
          {INSTRUMENTS.map(instrument => (
            <option key={instrument} value={instrument} disabled={instrument !== 'custom' && takenInstruments.includes(instrument)}>
              {INSTRUMENT_NAMES[instrument]}
            </option>
          ))}
        </Select>
      </Field>
      {value.instrument === 'custom' && (
        <Field label="声部名称" className="flex-1">
          <TextInput
            value={value.customLabel}
            maxLength={40}
            placeholder="如：小号"
            onChange={event => onChange({ ...value, customLabel: event.target.value })}
          />
        </Field>
      )}
    </div>
  );
}
