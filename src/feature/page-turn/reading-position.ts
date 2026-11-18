import { readStored, writeStored } from '@/shared/lib/local-storage';

// Per-device by design: two musicians on two tablets keep independent bookmarks.
const READING_POSITION_KEY = 'musheet.reading-position';
const LAST_VIEWED_KEY = 'musheet.last-viewed';
const MAX_REMEMBERED_PARTS = 300;

export interface LastViewed {
  partId: string;
  page: number;
}

export function readSavedPage(partId: string): number | undefined {
  return readStored<Record<string, number>>(READING_POSITION_KEY, {})[partId];
}

export function saveReadingPosition(partId: string, page: number) {
  const positions = readStored<Record<string, number>>(READING_POSITION_KEY, {});
  delete positions[partId];
  positions[partId] = page;
  const entries = Object.entries(positions);
  writeStored(READING_POSITION_KEY, Object.fromEntries(entries.slice(-MAX_REMEMBERED_PARTS)));
  writeStored(LAST_VIEWED_KEY, { partId, page } satisfies LastViewed);
}

export function readLastViewed(): LastViewed | null {
  return readStored<LastViewed | null>(LAST_VIEWED_KEY, null);
}
