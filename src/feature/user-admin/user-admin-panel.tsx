import { ACCOUNT_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type ManagedUserView } from '@contract/api';
import { Ellipsis, KeyRound, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserAvatar } from '@/entity/user/user-avatar';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { readText, useText } from '@/shared/i18n/text';
import { runUndoable } from '@/shared/lib/undoable';
import { Button, IconButton } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Field, TextInput } from '@/shared/ui/form-field';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/shared/ui/menu';
import { Skeleton, SkeletonRegion, skeletonKeys } from '@/shared/ui/skeleton';
import { deleteUser, hideUserFromList, refreshUserList, useCreateUser, useResetUserPassword, useUserList } from './user-admin-api';
import { USER_ADMIN_TEXT } from './user-admin-text';

function removeUserWithUndo(user: ManagedUserView) {
  runUndoable({
    message: readText(USER_ADMIN_TEXT).deleted(user.account),
    apply: () => hideUserFromList(user.id),
    commit: async () => {
      await deleteUser(user.id);
      await refreshUserList();
    },
    revert: () => void refreshUserList(),
  });
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const text = useText(USER_ADMIN_TEXT);
  const commonText = useText(COMMON_TEXT);
  const createUser = useCreateUser();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!open) return;
    setAccount('');
    setPassword('');
  }, [open]);

  const canCreate = account.trim().length > 0 && password.length >= PASSWORD_MIN_LENGTH && !createUser.isPending;
  const create = () => {
    if (!canCreate) return;
    createUser.mutate({ account: account.trim(), password }, {
      onSuccess: user => {
        toast.success(readText(USER_ADMIN_TEXT).created(user.account));
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={text.newUser}
      footer={(
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{commonText.cancel}</Button>
          <Button variant="primary" disabled={!canCreate} onClick={create}>{text.create}</Button>
        </>
      )}
    >
      <form className="space-y-4 pb-2" onSubmit={event => { event.preventDefault(); create(); }}>
        <Field label={text.username}>
          <TextInput autoFocus autoCapitalize="none" spellCheck={false} autoComplete="off" maxLength={ACCOUNT_MAX_LENGTH} value={account} onChange={event => setAccount(event.target.value)} />
        </Field>
        <Field label={text.password}>
          <TextInput type="password" autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} value={password} onChange={event => setPassword(event.target.value)} />
        </Field>
        <p className="text-caption text-fg-quiet">{text.passwordHint}</p>
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: ManagedUserView | null; onClose: () => void }) {
  const text = useText(USER_ADMIN_TEXT);
  const commonText = useText(COMMON_TEXT);
  const resetPassword = useResetUserPassword();
  const [password, setPassword] = useState('');

  useEffect(() => setPassword(''), [user]);

  const canSave = user !== null && password.length >= PASSWORD_MIN_LENGTH && !resetPassword.isPending;
  const save = () => {
    if (!canSave) return;
    resetPassword.mutate({ userId: user.id, password }, {
      onSuccess: () => {
        toast.success(readText(USER_ADMIN_TEXT).resetDone);
        onClose();
      },
    });
  };

  return (
    <Dialog
      open={user !== null}
      onOpenChange={open => !open && onClose()}
      title={user ? text.resetTitle(user.account) : ''}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{commonText.cancel}</Button>
          <Button variant="primary" disabled={!canSave} onClick={save}>{commonText.save}</Button>
        </>
      )}
    >
      <form className="space-y-2 pb-2" onSubmit={event => { event.preventDefault(); save(); }}>
        <Field label={text.newPassword}>
          <TextInput autoFocus type="password" autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} value={password} onChange={event => setPassword(event.target.value)} />
        </Field>
        <p className="text-caption text-fg-quiet">{text.passwordHint}</p>
      </form>
    </Dialog>
  );
}

const USER_ROW_SKELETON_COUNT = 2;

function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function UserRow({ user, onResetPassword }: { user: ManagedUserView; onResetPassword: () => void }) {
  const text = useText(USER_ADMIN_TEXT);
  const commonText = useText(COMMON_TEXT);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <UserAvatar account={user.account} avatar={user.avatar} className="size-9 text-sm" />
      <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">{user.account}</span>
      <Menu>
        <MenuTrigger asChild>
          <IconButton label={commonText.moreActions} className="size-9"><Ellipsis /></IconButton>
        </MenuTrigger>
        <MenuContent>
          <MenuItem icon={<KeyRound />} onSelect={onResetPassword}>{text.resetPassword}</MenuItem>
          <MenuItem icon={<Trash2 />} tone="danger" onSelect={() => removeUserWithUndo(user)}>{text.deleteUser}</MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

/** Root-only list of the other accounts, with create, password reset and delete. */
export function UserAdminPanel() {
  const text = useText(USER_ADMIN_TEXT);
  const users = useUserList();
  const [isCreating, setIsCreating] = useState(false);
  const [resetting, setResetting] = useState<ManagedUserView | null>(null);

  return (
    <section className="mb-8">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h3 className="text-caption font-semibold text-fg-quiet">{text.title}</h3>
        <Button size="sm" variant="ghost" className="text-score hover:bg-score-soft hover:text-score" onClick={() => setIsCreating(true)}>
          <UserPlus />
          {text.newUser}
        </Button>
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface">
        {users.isPending && (
          <SkeletonRegion className="divide-y divide-border">
            {skeletonKeys(USER_ROW_SKELETON_COUNT).map(key => <UserRowSkeleton key={key} />)}
          </SkeletonRegion>
        )}
        {users.data?.length === 0 && <p className="px-4 py-6 text-center text-sm text-fg-quiet">{text.noUsers}</p>}
        {users.data?.map(user => <UserRow key={user.id} user={user} onResetPassword={() => setResetting(user)} />)}
      </div>
      <CreateUserDialog open={isCreating} onOpenChange={setIsCreating} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
    </section>
  );
}
