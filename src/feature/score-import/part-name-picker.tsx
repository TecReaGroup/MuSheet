import { useEffect } from 'react';
import { usePartNameList } from '@/entity/part/part-name-api';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { readStored, writeStored } from '@/shared/lib/local-storage';
import { Field } from '@/shared/ui/form-field';
import { OptionSelect } from '@/shared/ui/option-select';

const LAST_PART_NAME_KEY = 'musheet.last-part-name';

/** Empty until the user has imported once; `PartNamePicker` then fills in the first name of the list. */
export function lastPartName(): string {
  return readStored<string>(LAST_PART_NAME_KEY, '');
}

export function rememberPartName(name: string) {
  writeStored(LAST_PART_NAME_KEY, name);
}

interface PartNamePickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function PartNamePicker({ value, onChange }: PartNamePickerProps) {
  const { data: names = [] } = usePartNameList();
  const commonText = useText(COMMON_TEXT);
  const firstName = names[0];

  useEffect(() => {
    if (!value && firstName) onChange(firstName);
  }, [value, firstName, onChange]);

  // A remembered name removed from the shared list since stays selectable, so nothing changes under the user.
  const options = value && !names.includes(value) ? [value, ...names] : names;
  return (
    <Field label={commonText.part} required>
      <OptionSelect value={value} onChange={onChange} options={options} />
    </Field>
  );
}
