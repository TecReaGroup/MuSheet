import { useEffect, useState } from 'react';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { defineText, useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, TextInput } from '@/shared/ui/form-field';

const SETLIST_FORM_TEXT = defineText({
  'zh-CN': { name: '名称', namePlaceholder: '圣诞音乐会', description: '描述', descriptionPlaceholder: '演出时间、地点，或给乐手的备注' },
  en: { name: 'Name', namePlaceholder: 'Christmas concert', description: 'Description', descriptionPlaceholder: 'Date, venue, or notes for the band' },
});

export interface SetlistFormValues {
  name: string;
  description: string;
}

interface SetlistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  initial: SetlistFormValues;
  isSubmitting: boolean;
  onSubmit: (values: SetlistFormValues) => void;
}

export function SetlistFormDialog({ open, onOpenChange, title, submitLabel, initial, isSubmitting, onSubmit }: SetlistFormDialogProps) {
  const [values, setValues] = useState(initial);
  const text = useText(SETLIST_FORM_TEXT);
  const commonText = useText(COMMON_TEXT);

  // Reset only when the dialog opens; `initial` is often a fresh object on every parent render.
  useEffect(() => {
    if (open) setValues(initial);
  }, [open]);

  const canSubmit = values.name.trim().length > 0 && !isSubmitting;
  const submit = () => {
    if (canSubmit) onSubmit({ name: values.name.trim(), description: values.description.trim() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={(
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{commonText.cancel}</Button>
          <Button variant="setlist" disabled={!canSubmit} onClick={submit}>{submitLabel}</Button>
        </>
      )}
    >
      <form className="space-y-4 pb-2" onSubmit={event => { event.preventDefault(); submit(); }}>
        <Field label={text.name} required>
          <TextInput autoFocus value={values.name} maxLength={120} placeholder={text.namePlaceholder} onChange={event => setValues({ ...values, name: event.target.value })} />
        </Field>
        <Field label={text.description}>
          <TextInput value={values.description} maxLength={500} placeholder={text.descriptionPlaceholder} onChange={event => setValues({ ...values, description: event.target.value })} />
        </Field>
      </form>
    </Dialog>
  );
}
