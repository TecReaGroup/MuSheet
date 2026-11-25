import { TAG_LIST_MAX_SIZE, TAG_MAX_LENGTH } from '@contract/api';
import { Plus, Tag, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useReplaceTags, useTagList } from '@/entity/tag/tag-api';
import { useText } from '@/shared/i18n/text';
import { Button, IconButton } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/form-field';
import { SettingGroup } from './setting-group';
import { SETTING_TEXT } from './setting-text';

export function TagSection() {
  const { data: tags = [] } = useTagList();
  const replaceTags = useReplaceTags();
  const [draft, setDraft] = useState('');
  const text = useText(SETTING_TEXT);

  const name = draft.trim();
  const isDuplicate = tags.some(tag => tag.toLowerCase() === name.toLowerCase());
  const canAdd = name.length > 0 && !isDuplicate && tags.length < TAG_LIST_MAX_SIZE;

  const addTag = (event: FormEvent) => {
    event.preventDefault();
    if (!canAdd) return;
    replaceTags.mutate([...tags, name]);
    setDraft('');
  };

  return (
    <SettingGroup>
      <p className="px-4 py-3.5 text-caption leading-relaxed text-fg-quiet">{text.tagDescription}</p>
      {tags.map(tag => (
        <div key={tag} className="flex items-center gap-3.5 py-1.5 pl-4 pr-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-muted text-fg-muted [&_svg]:size-[18px]"><Tag /></span>
          <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">{tag}</span>
          {/* The server keeps at least one tag so the import picker is never empty. */}
          <IconButton label={text.removeTag(tag)} disabled={tags.length <= 1} onClick={() => replaceTags.mutate(tags.filter(candidate => candidate !== tag))}>
            <X />
          </IconButton>
        </div>
      ))}
      <form onSubmit={addTag} className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TextInput
            className="flex-1"
            value={draft}
            maxLength={TAG_MAX_LENGTH}
            placeholder={text.tagPlaceholder}
            aria-label={text.addTag}
            onChange={event => setDraft(event.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={!canAdd}><Plus />{text.addTag}</Button>
        </div>
        {isDuplicate && <p className="mt-2 text-caption text-danger">{text.tagExists}</p>}
      </form>
    </SettingGroup>
  );
}
