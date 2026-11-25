import { copyFile, mkdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { appConfig } from '../config/app-config';
import { projectPath } from '../config/project-path';

const PDF_DIR = join(appConfig.dataDir, 'pdf');
const THUMBNAIL_DIR = join(appConfig.dataDir, 'thumbnail');
const AVATAR_DIR = join(appConfig.dataDir, 'avatar');

export function pdfFilePath(sha256: string) {
  return join(PDF_DIR, `${sha256}.pdf`);
}

export function thumbnailFilePath(sha256: string) {
  return join(THUMBNAIL_DIR, `${sha256}.jpg`);
}

/** Served by the `/file/` static route, so the URL mirrors the directory layout. */
export function avatarFileUrl(sha256: string) {
  return `/file/avatar/${sha256}.jpg`;
}

export function avatarFilePath(sha256: string) {
  return join(AVATAR_DIR, `${sha256}.jpg`);
}

export function tempFilePath(name: string) {
  return join(projectPath.temp, name);
}

export async function ensureStorageDirs() {
  await Promise.all([PDF_DIR, THUMBNAIL_DIR, AVATAR_DIR, projectPath.temp].map(dir => mkdir(dir, { recursive: true })));
}

/** Moves a finished upload into storage; falls back to copy when temp and data live on different volumes (Docker bind mounts). */
export async function moveIntoStorage(source: string, destination: string) {
  try {
    await rename(source, destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
    await copyFile(source, destination);
    await rm(source, { force: true });
  }
}

export async function removeStoredAvatar(sha256: string) {
  await rm(avatarFilePath(sha256), { force: true });
}

export async function removeStoredPdfs(sha256List: string[]) {
  await Promise.all(sha256List.flatMap(sha256 => [
    rm(pdfFilePath(sha256), { force: true }),
    rm(thumbnailFilePath(sha256), { force: true }),
  ]));
}
