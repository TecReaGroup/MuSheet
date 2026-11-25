import type { SessionView } from '@contract/api';
import { AtSign, Camera, KeyRound, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { UserAvatar } from '@/entity/user/user-avatar';
import { USER_ROLE_TEXT } from '@/entity/user/user-role';
import { ACCOUNT_TEXT } from '@/feature/account/account-text';
import { AvatarDialog } from '@/feature/account/avatar-dialog';
import { ChangePasswordDialog } from '@/feature/account/change-password-dialog';
import { RenameAccountDialog } from '@/feature/account/rename-account-dialog';
import { logout, useSession } from '@/feature/auth/session-api';
import { UserAdminPanel } from '@/feature/user-admin/user-admin-panel';
import { describeError } from '@/shared/api/http-client';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { Button } from '@/shared/ui/button';
import { SettingGroup, SettingRow } from './setting-group';
import { SETTING_TEXT } from './setting-text';

type OpenDialog = 'avatar' | 'rename' | 'password' | null;

function ProfileCard({ session, onChangeAvatar }: { session: SessionView; onChangeAvatar: () => void }) {
  const text = useText(ACCOUNT_TEXT);
  const roleText = useText(USER_ROLE_TEXT);
  return (
    <div className="flex items-center gap-4 px-5 py-5">
      <button
        type="button"
        onClick={onChangeAvatar}
        aria-label={text.changeAvatar}
        title={text.changeAvatar}
        className="group relative shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-focus/40"
      >
        <UserAvatar account={session.account} avatar={session.avatar} className="size-16 text-2xl transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none" />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-surface text-fg-muted shadow-[0_1px_3px_rgb(0_0_0/0.15)] ring-1 ring-border transition-colors group-hover:text-score">
          <Camera className="size-3.5" />
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold tracking-tight text-fg-title">{session.account}</p>
        <span
          className={cn(
            'mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
            session.isRoot ? 'bg-score-soft text-score' : 'bg-muted text-fg-muted',
          )}
        >
          {session.isRoot ? roleText.root : roleText.member}
        </span>
      </div>
    </div>
  );
}

export function AccountSection() {
  const session = useSession().data;
  const text = useText(SETTING_TEXT);
  const accountText = useText(ACCOUNT_TEXT);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  if (!session) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  const closeDialog = (open: boolean) => !open && setOpenDialog(null);
  const credentialHint = session.isRoot ? accountText.managedInEnv : undefined;

  return (
    <>
      <SettingGroup>
        <ProfileCard session={session} onChangeAvatar={() => setOpenDialog('avatar')} />
        <SettingRow
          icon={<AtSign />}
          title={accountText.username}
          description={credentialHint ?? session.account}
          control={<Button size="sm" disabled={session.isRoot} onClick={() => setOpenDialog('rename')}>{accountText.change}</Button>}
        />
        <SettingRow
          icon={<KeyRound />}
          title={accountText.password}
          description={credentialHint ?? '••••••••'}
          control={<Button size="sm" disabled={session.isRoot} onClick={() => setOpenDialog('password')}>{accountText.change}</Button>}
        />
      </SettingGroup>

      {session.isRoot && <UserAdminPanel />}

      <SettingGroup>
        <SettingRow
          icon={<LogOut />}
          title={text.logout}
          control={<Button size="sm" variant="danger" onClick={() => void handleLogout()}>{text.logoutAction}</Button>}
        />
      </SettingGroup>

      <AvatarDialog session={session} open={openDialog === 'avatar'} onOpenChange={closeDialog} />
      <RenameAccountDialog currentAccount={session.account} open={openDialog === 'rename'} onOpenChange={closeDialog} />
      <ChangePasswordDialog open={openDialog === 'password'} onOpenChange={closeDialog} />
    </>
  );
}
