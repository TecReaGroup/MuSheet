import type { SessionView } from '@contract/api';
import { ImageUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { UserAvatar } from '@/entity/user/user-avatar';
import { readText, useText } from '@/shared/i18n/text';
import { log, serializeError } from '@/shared/lib/logger';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { useUploadAvatarImage } from './account-api';
import { ACCOUNT_TEXT } from './account-text';
import { AvatarCropper } from './avatar-cropper';
import { AvatarImageError, cropAvatarImage, loadAvatarImage, releaseAvatarImage, type SquareCrop } from './crop-avatar-image';

interface AvatarDialogProps {
  session: SessionView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function reportUnreadableImage(error: unknown) {
  log('warn', 'Account', 'Avatar image unreadable', serializeError(error));
  if (error instanceof AvatarImageError) toast.error(readText(ACCOUNT_TEXT).unreadableImage);
  else throw error;
}

/** Upload, then crop: the picked file stays local until the user confirms the square. */
export function AvatarDialog({ session, open, onOpenChange }: AvatarDialogProps) {
  const text = useText(ACCOUNT_TEXT);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const uploadImage = useUploadAvatarImage();

  const discardSource = () => {
    if (sourceImage) releaseAvatarImage(sourceImage);
    setSourceImage(null);
  };

  const changeOpen = (next: boolean) => {
    if (!next) discardSource();
    onOpenChange(next);
  };

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setSourceImage(await loadAvatarImage(file));
    } catch (error) {
      reportUnreadableImage(error);
    }
  };

  const saveCrop = async (image: HTMLImageElement, crop: SquareCrop) => {
    try {
      uploadImage.mutate(await cropAvatarImage(image, crop), {
        onSuccess: () => {
          toast.success(readText(ACCOUNT_TEXT).avatarUpdated);
          changeOpen(false);
        },
      });
    } catch (error) {
      reportUnreadableImage(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen} title={text.avatarTitle} description={text.avatarDescription}>
      {sourceImage ? (
        <AvatarCropper
          key={sourceImage.src}
          image={sourceImage}
          isSaving={uploadImage.isPending}
          onCancel={discardSource}
          onConfirm={crop => void saveCrop(sourceImage, crop)}
        />
      ) : (
        <div className="pt-4 pb-6">
          <div className="mb-12 flex items-center justify-center">
            <UserAvatar account={session.account} avatar={session.avatar} className="size-24 text-4xl ring-4 ring-muted" />
          </div>
          <Button variant="primary" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <ImageUp />
            {text.uploadImage}
          </Button>
        </div>
      )}
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
    </Dialog>
  );
}
