import { useEffect } from 'react';
import { useTagList } from '@/entity/tag/tag-api';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { readStored, writeStored } from '@/shared/lib/local-storage';
import { Field, Select } from '@/shared/ui/form-field';

const LAST_TAG_KEY = 'musheet.last-tag';

/** Empty until the user has imported once; `TagPicker` then fills in the first tag of the list. */
export function lastTag(): string {
  return readStored<string>(LAST_TAG_KEY, '');
}

export function rememberTag(tag: string) {
  writeStored(LAST_TAG_KEY, tag);
}

interface TagPickerProps {
  value: string;
  onChange: (tag: string) => void;
}

export function TagPicker({ value, onChange }: TagPickerProps) {
  const { data: tags = [] } = useTagList();
  const commonText = useText(COMMON_TEXT);
  const firstTag = tags[0];

  useEffect(() => {
    if (!value && firstTag) onChange(firstTag);
  }, [value, firstTag, onChange]);

  // A remembered tag removed from the shared list since stays selectable, so nothing changes under the user.
  const options = value && !tags.includes(value) ? [value, ...tags] : tags;
  return (
    <Field label={commonText.tag}>
      <Select value={value} onChange={event => onChange(event.target.value)}>
        {options.map(tag => <option key={tag} value={tag}>{tag}</option>)}
      </Select>
    </Field>
  );
}
