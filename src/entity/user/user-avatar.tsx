import type { AvatarPreset, AvatarView } from '@contract/api';
import { AudioLines, Disc3, Drum, Guitar, Headphones, Mic, Music, Piano, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/class-name';

interface PresetStyle {
  icon: LucideIcon;
  gradient: string;
}

export const AVATAR_PRESET_STYLE: Record<AvatarPreset, PresetStyle> = {
  note: { icon: Music, gradient: 'from-sky-400 to-blue-600' },
  piano: { icon: Piano, gradient: 'from-slate-500 to-slate-800' },
  guitar: { icon: Guitar, gradient: 'from-amber-400 to-orange-600' },
  drum: { icon: Drum, gradient: 'from-rose-400 to-red-600' },
  mic: { icon: Mic, gradient: 'from-fuchsia-400 to-purple-600' },
  headphones: { icon: Headphones, gradient: 'from-teal-400 to-emerald-600' },
  disc: { icon: Disc3, gradient: 'from-indigo-400 to-violet-600' },
  wave: { icon: AudioLines, gradient: 'from-lime-400 to-green-600' },
};

const ROUND_TILE = 'flex shrink-0 items-center justify-center overflow-hidden rounded-full';

/** Sized by `className` (e.g. `size-10`); icon and letter scale with it. */
export function PresetAvatar({ preset, className }: { preset: AvatarPreset; className?: string }) {
  const { icon: Icon, gradient } = AVATAR_PRESET_STYLE[preset];
  return (
    <span className={cn(ROUND_TILE, 'bg-linear-to-br text-white', gradient, className)}>
      <Icon className="size-1/2" />
    </span>
  );
}

interface UserAvatarProps {
  account: string;
  avatar: AvatarView;
  className?: string;
}

export function UserAvatar({ account, avatar, className }: UserAvatarProps) {
  if (avatar.kind === 'preset') return <PresetAvatar preset={avatar.preset} className={className} />;
  if (avatar.kind === 'image') {
    return <img src={avatar.url} alt="" draggable={false} className={cn(ROUND_TILE, 'object-cover', className)} />;
  }
  return (
    <span className={cn(ROUND_TILE, 'bg-muted font-medium uppercase text-fg-quiet', className)}>
      {account.charAt(0)}
    </span>
  );
}
