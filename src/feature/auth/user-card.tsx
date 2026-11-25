import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router';
import { UserAvatar } from '@/entity/user/user-avatar';
import { USER_ROLE_TEXT } from '@/entity/user/user-role';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { useSession } from './session-api';

export function UserCard({ to }: { to: string }) {
  const session = useSession().data;
  const roleText = useText(USER_ROLE_TEXT);
  if (!session) return null;

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'group flex items-center gap-3 rounded-panel bg-surface p-2.5 pr-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 outline-none',
        'transition-[box-shadow,transform] duration-200 ease-out hover:shadow-[0_6px_20px_rgb(0_0_0/0.07)] active:scale-[0.98]',
        'focus-visible:ring-3 focus-visible:ring-focus/25 motion-reduce:transform-none motion-reduce:transition-none dark:shadow-none',
        isActive ? 'ring-score/40' : 'ring-border',
      )}
    >
      <UserAvatar account={session.account} avatar={session.avatar} className="size-10 text-base" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold leading-tight tracking-tight text-fg-title">{session.account}</span>
        <span className="mt-1 text-caption leading-none text-fg-quiet">{session.isRoot ? roleText.root : roleText.member}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-fg-faint transition-[transform,color] duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-fg-muted motion-reduce:transform-none" />
    </NavLink>
  );
}
