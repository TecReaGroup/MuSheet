import { AVATAR_IMAGE_MAX_BYTES } from '@contract/api';

// 2x the largest on-screen avatar (96px) keeps it sharp on retina while staying far below the upload cap.
const AVATAR_PIXELS = 192;
const JPEG_QUALITY = 0.88;

export class AvatarImageError extends Error {}

/** Square region of the source image, in natural pixels. */
export interface SquareCrop {
  x: number;
  y: number;
  side: number;
}

/** The returned image keeps its object URL alive for preview; pair with `releaseAvatarImage`. */
export function loadAvatarImage(file: File) {
  const url = URL.createObjectURL(file);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AvatarImageError('Unreadable image'));
    };
    image.src = url;
  });
}

export function releaseAvatarImage(image: HTMLImageElement) {
  URL.revokeObjectURL(image.src);
}

/**
 * Renders the chosen square to a JPEG. Re-encoding on the client strips EXIF/GPS data and lets
 * the server accept a single format.
 */
export async function cropAvatarImage(image: HTMLImageElement, crop: SquareCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_PIXELS;
  canvas.height = AVATAR_PIXELS;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, crop.x, crop.y, crop.side, crop.side, 0, 0, AVATAR_PIXELS, AVATAR_PIXELS);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob || blob.size > AVATAR_IMAGE_MAX_BYTES) throw new AvatarImageError('Image could not be encoded');
  return blob;
}
