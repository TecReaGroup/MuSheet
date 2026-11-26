import { ACCOUNT_MAX_LENGTH } from '@contract/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { readText, useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, TextInput } from '@/shared/ui/form-field';
import { useRenameAccount } from './account-api';
import { ACCOUNT_TEXT } from './account-text';

interface RenameAccountDialogProps {
  currentAccount: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameAccountDialog({ currentAccount, open, onOpenChange }: RenameAccountDialogProps) {
  const text = useText(ACCOUNT_TEXT);
  const commonText = useText(COMMON_TEXT);
  const renameAccount = useRenameAccount();
  const [account, setAccount] = useState(currentAccount);

  useEffect(() => {
    if (open) setAccount(currentAccount);
  }, [open, currentAccount]);

  const trimmed = account.trim();
  const canSave = trimmed.length > 0 && trimmed !== currentAccount && !renameAccount.isPending;
  const save = () => {
    if (!canSave) return;
    renameAccount.mutate({ account: trimmed }, {
      onSuccess: () => {
        toast.success(readText(ACCOUNT_TEXT).renamed);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={text.renameTitle}
      footer={(
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{commonText.cancel}</Button>
          <Button variant="primary" disabled={!canSave} onClick={save}>{commonText.save}</Button>
        </>
      )}
    >
      <form className="space-y-2 pb-2" onSubmit={event => { event.preventDefault(); save(); }}>
        <Field label={text.username} required>
          <TextInput
            autoFocus
            autoCapitalize="none"
            spellCheck={false}
            value={account}
            maxLength={ACCOUNT_MAX_LENGTH}
            pattern="[A-Za-z0-9._\-]+"
            onChange={event => setAccount(event.target.value)}
          />
        </Field>
        <p className="text-caption text-fg-quiet">{text.renameHint}</p>
      </form>
    </Dialog>
  );
}
