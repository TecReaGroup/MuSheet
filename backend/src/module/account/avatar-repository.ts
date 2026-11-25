import { rm } from 'node:fs/promises';
import type { Readable } from 'node:stream';
import { eq, inArray } from 'drizzle-orm';
import { AVATAR_IMAGE_MAX_BYTES, type AvatarPreset, type AvatarView } from '../../../../contract/api';
import { db } from '../../db/client';
import { userAvatar } from '../../db/schema';
import { HttpError } from '../../http/http-error';
import { avatarFilePath, avatarFileUrl, moveIntoStorage, removeStoredAvatar } from '../../infrastructure/file-storage';
import { log } from '../../infrastructure/logger';
import { JPEG_SIGNATURE_BYTES, startsWithJpegSignature, writeUploadToTemp } from '../../infrastructure/upload-temp';

const LETTER_AVATAR: AvatarView = { kind: 'letter' };

type AvatarRow = typeof userAvatar.$inferSelect;

function toAvatarView(row: AvatarRow | undefined): AvatarView {
  if (row?.preset) return { kind: 'preset', preset: row.preset };
  if (row?.imageSha256) return { kind: 'image', url: avatarFileUrl(row.imageSha256) };
  return LETTER_AVATAR;
}

export async function findAvatar(userId: string): Promise<AvatarView> {
  const [row] = await db.select().from(userAvatar).where(eq(userAvatar.userId, userId));
  return toAvatarView(row);
}

export async function findAvatars(userIds: string[]): Promise<Map<string, AvatarView>> {
  const rows = userIds.length === 0 ? [] : await db.select().from(userAvatar).where(inArray(userAvatar.userId, userIds));
  const byUser = new Map(rows.map(row => [row.userId, toAvatarView(row)]));
  return new Map(userIds.map(id => [id, byUser.get(id) ?? LETTER_AVATAR]));
}

/** Images are content-addressed and may be shared, so a file is removed only when no avatar points at it anymore. */
export async function releaseAvatarImage(sha256: string | null) {
  if (!sha256) return;
  const [stillUsed] = await db.select({ userId: userAvatar.userId }).from(userAvatar).where(eq(userAvatar.imageSha256, sha256)).limit(1);
  if (!stillUsed) await removeStoredAvatar(sha256);
}

async function replaceAvatar(userId: string, next: Pick<AvatarRow, 'preset' | 'imageSha256'> | null) {
  const previous = await db.transaction(async transaction => {
    const [current] = await transaction.select().from(userAvatar).where(eq(userAvatar.userId, userId)).for('update');
    if (next) {
      await transaction.insert(userAvatar).values({ userId, ...next }).onConflictDoUpdate({ target: userAvatar.userId, set: next });
    } else {
      await transaction.delete(userAvatar).where(eq(userAvatar.userId, userId));
    }
    return current?.imageSha256 ?? null;
  });
  if (previous !== next?.imageSha256) await releaseAvatarImage(previous);
}

export function choosePresetAvatar(userId: string, preset: AvatarPreset) {
  return replaceAvatar(userId, { preset, imageSha256: null });
}

export function resetAvatar(userId: string) {
  return replaceAvatar(userId, null);
}

/** The client crops and encodes the image; the server only checks size and that it really is a JPEG. */
export async function uploadImageAvatar(userId: string, body: Readable) {
  const { tempPath, meter } = await writeUploadToTemp(body, AVATAR_IMAGE_MAX_BYTES, JPEG_SIGNATURE_BYTES);
  try {
    if (!startsWithJpegSignature(meter.head())) throw new HttpError(415, 'not_jpeg', 'Avatar must be a JPEG');
    const sha256 = meter.digest();
    await moveIntoStorage(tempPath, avatarFilePath(sha256));
    await replaceAvatar(userId, { preset: null, imageSha256: sha256 });
    log('info', 'Account', 'Stored avatar image', { sha256: sha256.slice(0, 12), size: meter.size() });
  } finally {
    await rm(tempPath, { force: true });
  }
}
