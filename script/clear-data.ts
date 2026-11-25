import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { appConfig } from '../backend/src/config/app-config';
import { sqlClient } from '../backend/src/db/client';
import { applyMigrations } from '../backend/src/db/migrate';
import { ensureStorageDirs } from '../backend/src/infrastructure/file-storage';
import { log, serializeError } from '../backend/src/infrastructure/logger';

const LIBRARY_FILE_DIRS = ['pdf', 'thumbnail'];
const ACCOUNT_FILE_DIRS = ['avatar'];

async function removeStorageDirs(dirNames: string[]) {
  await Promise.all(dirNames.map(name => rm(join(appConfig.dataDir, name), { recursive: true, force: true })));
  await ensureStorageDirs();
}

// Rows go first: if the truncate fails, the files they point at are still there.

/** Removes every score and setlist in every space, with their parts, annotations and PDFs. Accounts stay. */
async function clearLibraries() {
  await sqlClient`truncate table setlist, score, pdf_file cascade`;
  await removeStorageDirs(LIBRARY_FILE_DIRS);
  log('info', 'Clear', 'Cleared scores and setlists');
}

/** Resets the app to a fresh install: libraries, accounts and avatars. Root survives because it lives in .env. */
async function clearEverything() {
  await sqlClient`truncate table setlist, score, pdf_file, app_user, user_avatar cascade`;
  await removeStorageDirs([...LIBRARY_FILE_DIRS, ...ACCOUNT_FILE_DIRS]);
  log('info', 'Clear', 'Cleared all data');
}

const CLEAR_LEVELS: Record<string, () => Promise<void>> = {
  light: clearLibraries,
  deep: clearEverything,
};

async function clear(level: string | undefined) {
  const clearLevel = level ? CLEAR_LEVELS[level] : undefined;
  if (!clearLevel) throw new Error(`Usage: clear-data.ts <${Object.keys(CLEAR_LEVELS).join('|')}>`);
  await applyMigrations();
  await clearLevel();
}

clear(process.argv[2])
  .catch(error => {
    log('error', 'Clear', 'Clear failed', { error: serializeError(error) });
    process.exitCode = 1;
  })
  .finally(() => sqlClient.end({ timeout: 5 }));
