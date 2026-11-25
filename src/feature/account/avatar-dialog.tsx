import { AVATAR_PRESETS, type AvatarPreset, type SessionView } from '@contract/api';
import { Check, ImageUp, RotateCcw } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { PresetAvatar, UserAvatar } from '@/entity/user/user-avatar';
import { readText, useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { log, serializeError } from '@/shared/lib/logger';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Spinner } from '@/shared/ui/spinner';
import { useChoosePresetAvatar, useResetAvatar, useUploadAvatarImage } from './account-api';
import { ACCOUNT_TEXT } from './account-text';
import { AvatarImageError, cropAvatarImage } from './crop-avatar-image';

interface AvatarDialogProps {
  session: SessionView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OPTION_STYLE = 'relative rounded-full outline-none transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:ring-3 focus-visible:ring-focus/40 motion-reduce:transform-none';

function SelectedMark() {
  return (
    <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-score text-on-accent ring-2 ring-surface">
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

/** Applies each choice immediately: picking an avatar is cheap to undo by picking again. */
export function AvatarDialog({ session, open, onOpenChange }: AvatarDialogProps) {
  const text = useText(ACCOUNT_TEXT);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const choosePreset = useChoosePresetAvatar();
  const uploadImage = useUploadAvatarImage();
  const resetAvatar = useResetAvatar();
  const isBusy = choosePreset.isPending || uploadImage.isPending || resetAvatar.isPending;
  const announceUpdated = () => toast.success(readText(ACCOUNT_TEXT).avatarUpdated);

  const pickPreset = (preset: AvatarPreset) => choosePreset.mutate(preset, { onSuccess: announceUpdated });

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      uploadImage.mutate(await cropAvatarImage(file), { onSuccess: announceUpdated });
    } catch (error) {
      log('warn', 'Account', 'Avatar image unreadable', serializeError(error));
      if (error instanceof AvatarImageError) toast.error(readText(ACCOUNT_TEXT).unreadableImage);
      else throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={text.avatarTitle} description={text.avatarDescription}>
      <div className="pb-4">
        <div className="mb-5 flex items-center justify-center">
          <span className="relative">
            <UserAvatar account={session.account} avatar={session.avatar} className="size-24 text-4xl ring-4 ring-muted" />
            {isBusy && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-surface/60"><Spinner /></span>}
          </span>
        </div>

        <div className="grid grid-cols-4 justify-items-center gap-3">
          {AVATAR_PRESETS.map(preset => {
            const isSelected = session.avatar.kind === 'preset' && session.avatar.preset === preset;
            return (
              <button key={preset} type="button" disabled={isBusy} aria-pressed={isSelected} aria-label={preset} onClick={() => pickPreset(preset)} className={OPTION_STYLE}>
                <PresetAvatar preset={preset} className={cn('size-14', isSelected && 'ring-3 ring-score ring-offset-2 ring-offset-surface')} />
                {isSelected && <SelectedMark />}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <Button className="flex-1" disabled={isBusy} onClick={() => fileInputRef.current?.click()}>
            <ImageUp />
            {text.uploadImage}
          </Button>
          <Button variant="ghost" disabled={isBusy || session.avatar.kind === 'letter'} onClick={() => resetAvatar.mutate(undefined, { onSuccess: announceUpdated })}>
            <RotateCcw />
            {text.useLetter}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={event => {
            void pickFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
    </Dialog>
  );
}
