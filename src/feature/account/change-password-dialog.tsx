import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@contract/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { readText, useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, TextInput } from '@/shared/ui/form-field';
import { useChangePassword } from './account-api';
import { ACCOUNT_TEXT } from './account-text';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const text = useText(ACCOUNT_TEXT);
  const commonText = useText(COMMON_TEXT);
  const changePassword = useChangePassword();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  const isMismatch = form.confirmPassword.length > 0 && form.confirmPassword !== form.newPassword;
  const canSave = form.currentPassword.length > 0
    && form.newPassword.length >= PASSWORD_MIN_LENGTH
    && form.confirmPassword === form.newPassword
    && !changePassword.isPending;

  const save = () => {
    if (!canSave) return;
    changePassword.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword }, {
      onSuccess: () => {
        toast.success(readText(ACCOUNT_TEXT).passwordChanged);
        onOpenChange(false);
      },
    });
  };

  const passwordInput = (key: keyof typeof EMPTY_FORM, autoComplete: string) => (
    <TextInput
      type="password"
      autoComplete={autoComplete}
      maxLength={PASSWORD_MAX_LENGTH}
      value={form[key]}
      onChange={event => setForm({ ...form, [key]: event.target.value })}
    />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={text.passwordTitle}
      footer={(
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{commonText.cancel}</Button>
          <Button variant="primary" disabled={!canSave} onClick={save}>{commonText.save}</Button>
        </>
      )}
    >
      <form className="space-y-4 pb-2" onSubmit={event => { event.preventDefault(); save(); }}>
        <Field label={text.currentPassword}>{passwordInput('currentPassword', 'current-password')}</Field>
        <Field label={text.newPassword}>{passwordInput('newPassword', 'new-password')}</Field>
        <Field label={text.confirmPassword}>{passwordInput('confirmPassword', 'new-password')}</Field>
        <p className={isMismatch ? 'text-[13px] text-danger' : 'text-[13px] text-fg-quiet'}>
          {isMismatch ? text.passwordMismatch : text.passwordHint}
        </p>
      </form>
    </Dialog>
  );
}
