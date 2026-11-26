import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { and, inArray } from 'drizzle-orm';
import { TIME_SIGNATURES } from '../contract/api';
import { db, sqlClient } from '../backend/src/db/client';
import { applyMigrations } from '../backend/src/db/migrate';
import { score } from '../backend/src/db/schema';
import { ensureStorageDirs } from '../backend/src/infrastructure/file-storage';
import { log, serializeError } from '../backend/src/infrastructure/logger';
import { ROOT_USER_ID } from '../backend/src/module/auth/session-account';
import { storePdf } from '../backend/src/module/pdf/pdf-repository';
import { importScore, updateScore } from '../backend/src/module/score/score-repository';
import { createSetlist, replaceSetlistItems } from '../backend/src/module/setlist/setlist-repository';
import { TEAM_SPACE_KEY, type VisibleSpaceKeys } from '../backend/src/module/space/space-key';
import { createUser, findUserByAccount } from '../backend/src/module/user/user-repository';
import { buildSamplePdf } from './sample-pdf';

// Libraries that receive the sample scores and setlists: root's personal library and the shared team one.
const SEED_SPACE_KEYS = [ROOT_USER_ID, TEAM_SPACE_KEY];
const SEED_USER_COUNT = 20;
const SEED_USER_PASSWORD = 'password123';
const SETLIST_COUNT = 20;
const PART_NAMES = ['Keyboard', 'Vocal', 'Guitar', 'Bass', 'Drums'];

const SAMPLE_SCORES = [
  { title: 'Autumn Leaves', composer: 'Joseph Kosma' },
  { title: 'Fly Me to the Moon', composer: 'Bart Howard' },
  { title: 'Take Five', composer: 'Paul Desmond' },
  { title: 'Blue Bossa', composer: 'Kenny Dorham' },
  { title: 'All the Things You Are', composer: 'Jerome Kern' },
  { title: 'So What', composer: 'Miles Davis' },
  { title: 'Moon River', composer: 'Henry Mancini' },
  { title: 'Summertime', composer: 'George Gershwin' },
  { title: 'Misty', composer: 'Erroll Garner' },
  { title: 'Body and Soul', composer: 'Johnny Green' },
  { title: 'Night and Day', composer: 'Cole Porter' },
  { title: 'Caravan', composer: 'Juan Tizol' },
  { title: 'Stella by Starlight', composer: 'Victor Young' },
  { title: 'In a Sentimental Mood', composer: 'Duke Ellington' },
  { title: 'Footprints', composer: 'Wayne Shorter' },
  { title: 'Cantaloupe Island', composer: 'Herbie Hancock' },
  { title: 'Blue in Green', composer: 'Bill Evans' },
  { title: 'Spain', composer: 'Chick Corea' },
  { title: 'Giant Steps', composer: 'John Coltrane' },
  { title: 'My Funny Valentine', composer: 'Richard Rodgers' },
];

const SETLIST_NAMES = [
  'Friday Rehearsal', 'Sunday Service', 'Jazz Night', 'Wedding Set', 'Acoustic Evening',
  'Spring Concert', 'Summer Festival', 'Open Mic', 'Warm-up Drills', 'Ballads Only',
  'Up-tempo Set', 'Latin Corner', 'Studio Session', 'Charity Gala', 'Coffee House',
  'Late Night Lounge', 'Student Recital', 'Holiday Party', 'Sound Check', 'Encore Picks',
];

function sha256Of(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

function spacesFor(spaceKey: string): VisibleSpaceKeys {
  return [spaceKey, TEAM_SPACE_KEY];
}

/** Importing a title that already exists joins it as an extra part, doubling the samples; refuse up front instead. */
async function assertSeedNotApplied() {
  const [existing] = await db.select({ title: score.title }).from(score)
    .where(and(inArray(score.spaceKey, SEED_SPACE_KEYS), inArray(score.title, SAMPLE_SCORES.map(sample => sample.title))))
    .limit(1);
  if (existing) {
    throw new Error(`Sample score "${existing.title}" already exists; run "make clear" first`);
  }
}

// Users survive a light clear, so existing ones are kept rather than treated as an error.
async function seedUsers() {
  let created = 0;
  for (let index = 1; index <= SEED_USER_COUNT; index += 1) {
    const account = `tester${String(index).padStart(2, '0')}`;
    if (await findUserByAccount(account)) continue;
    await createUser(account, SEED_USER_PASSWORD);
    created += 1;
  }
  log('info', 'Seed', 'Seeded users', { created, password: SEED_USER_PASSWORD });
}

async function storeSamplePdf(title: string, partName: string, pageCount: number) {
  const bytes = buildSamplePdf({ title, subtitle: `${partName} part`, pageCount });
  const sha256 = sha256Of(bytes);
  await storePdf(sha256, pageCount, Readable.from(bytes));
  return sha256;
}

async function seedScores(spaceKey: string): Promise<string[]> {
  const scoreIds: string[] = [];
  for (const [index, sample] of SAMPLE_SCORES.entries()) {
    const partCount = 1 + (index % 3);
    let scoreId = '';
    for (let partIndex = 0; partIndex < partCount; partIndex += 1) {
      const partName = PART_NAMES[(index + partIndex) % PART_NAMES.length]!;
      const pdfSha256 = await storeSamplePdf(sample.title, partName, 1 + ((index + partIndex) % 4));
      const imported = await importScore(spaceKey, { ...sample, partName, pdfSha256 });
      scoreId = imported.score.id;
    }
    await updateScore(scoreId, spacesFor(spaceKey), {
      bpm: 60 + index * 7,
      timeSignature: TIME_SIGNATURES[index % TIME_SIGNATURES.length],
    });
    scoreIds.push(scoreId);
  }
  log('info', 'Seed', 'Seeded scores', { space: spaceKey, count: scoreIds.length });
  return scoreIds;
}

async function seedSetlists(spaceKey: string, scoreIds: string[]) {
  for (let index = 0; index < SETLIST_COUNT; index += 1) {
    const setlist = await createSetlist(spaceKey, {
      name: SETLIST_NAMES[index % SETLIST_NAMES.length]!,
      description: `Sample setlist #${index + 1}`,
    });
    const size = 3 + (index % 6);
    const picked = Array.from({ length: size }, (_, offset) => scoreIds[(index * 3 + offset) % scoreIds.length]!);
    await replaceSetlistItems(setlist.id, spacesFor(spaceKey), picked);
  }
  log('info', 'Seed', 'Seeded setlists', { space: spaceKey, count: SETLIST_COUNT });
}

async function seed() {
  await ensureStorageDirs();
  await applyMigrations();
  await assertSeedNotApplied();
  await seedUsers();
  for (const spaceKey of SEED_SPACE_KEYS) {
    const scoreIds = await seedScores(spaceKey);
    await seedSetlists(spaceKey, scoreIds);
  }
  log('info', 'Seed', 'Seed finished', { spaces: SEED_SPACE_KEYS });
}

seed()
  .catch(error => {
    log('error', 'Seed', 'Seed failed', { error: serializeError(error) });
    process.exitCode = 1;
  })
  .finally(() => sqlClient.end({ timeout: 5 }));
