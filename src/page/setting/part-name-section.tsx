import { PART_NAME_LIST_MAX_SIZE, PART_NAME_MAX_LENGTH } from '@contract/api';
import { Music, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { usePartNameList, useReplacePartNames } from '@/entity/part/part-name-api';
import { useText } from '@/shared/i18n/text';
import { Button, IconButton } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/form-field';
import { SettingGroup } from './setting-group';
import { SETTING_TEXT } from './setting-text';

export function PartNameGroup() {
  const { data: names = [] } = usePartNameList();
  const replacePartNames = useReplacePartNames();
  const [draft, setDraft] = useState('');
  const text = useText(SETTING_TEXT);

  const newName = draft.trim();
  const isDuplicate = names.some(name => name.toLowerCase() === newName.toLowerCase());
  const canAdd = newName.length > 0 && !isDuplicate && names.length < PART_NAME_LIST_MAX_SIZE;

  const addPartName = (event: FormEvent) => {
    event.preventDefault();
    if (!canAdd) return;
    replacePartNames.mutate([...names, newName]);
    setDraft('');
  };

  return (
    <SettingGroup title={text.partName}>
      <p className="px-4 py-3.5 text-caption leading-relaxed text-fg-quiet">{text.partNameDescription}</p>
      {names.map(name => (
        <div key={name} className="flex items-center gap-3.5 py-1.5 pl-4 pr-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-muted text-fg-muted [&_svg]:size-[18px]"><Music /></span>
          <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">{name}</span>
          {/* The server keeps at least one name so the import picker is never empty. */}
          <IconButton label={text.removePartName(name)} variant="dangerGhost" disabled={names.length <= 1} onClick={() => replacePartNames.mutate(names.filter(candidate => candidate !== name))}>
            <Trash2 />
          </IconButton>
        </div>
      ))}
      <form onSubmit={addPartName} className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TextInput
            className="flex-1"
            value={draft}
            maxLength={PART_NAME_MAX_LENGTH}
            placeholder={text.partNamePlaceholder}
            aria-label={text.addPartName}
            onChange={event => setDraft(event.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={!canAdd}><Plus />{text.addPartName}</Button>
        </div>
        {isDuplicate && <p className="mt-2 text-caption text-danger">{text.partNameExists}</p>}
      </form>
    </SettingGroup>
  );
}
