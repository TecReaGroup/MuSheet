import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, TextArea, TextInput } from '@/shared/ui/form-field';

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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button variant="setlist" disabled={!canSubmit} onClick={submit}>{submitLabel}</Button>
        </>
      )}
    >
      <form className="space-y-4 pb-2" onSubmit={event => { event.preventDefault(); submit(); }}>
        <Field label="名称">
          <TextInput autoFocus value={values.name} maxLength={120} placeholder="如：周六婚礼演出" onChange={event => setValues({ ...values, name: event.target.value })} />
        </Field>
        <Field label="描述">
          <TextArea value={values.description} maxLength={500} placeholder="可选" onChange={event => setValues({ ...values, description: event.target.value })} />
        </Field>
      </form>
    </Dialog>
  );
}
