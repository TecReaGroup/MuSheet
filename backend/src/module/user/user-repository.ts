import { asc, eq, sql } from 'drizzle-orm';
import { appConfig } from '../../config/app-config';
import { db } from '../../db/client';
import { postgresErrorCode, UNIQUE_VIOLATION } from '../../db/postgres-error';
import { appUser, userAvatar } from '../../db/schema';
import { HttpError, notFound } from '../../http/http-error';
import { hashPassword } from '../auth/password-hash';

export type UserRow = typeof appUser.$inferSelect;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function accountTaken() {
  return new HttpError(409, 'account_taken', 'Account name is already in use');
}

/** Root lives in .env, so the unique index cannot see it; names are compared case-insensitively like the index. */
function assertNotRootName(account: string) {
  if (account.toLowerCase() === appConfig.admin.account.toLowerCase()) throw accountTaken();
}

async function translateUniqueViolation<T>(write: Promise<T>) {
  try {
    return await write;
  } catch (error) {
    if (postgresErrorCode(error) === UNIQUE_VIOLATION) throw accountTaken();
    throw error;
  }
}

/** Session tokens carry arbitrary text ids; only well-formed UUIDs reach Postgres' uuid column. */
export async function findUserById(id: string): Promise<UserRow | undefined> {
  if (!UUID_PATTERN.test(id)) return undefined;
  const [row] = await db.select().from(appUser).where(eq(appUser.id, id));
  return row;
}

export async function findUserByAccount(account: string): Promise<UserRow | undefined> {
  const [row] = await db.select().from(appUser).where(eq(sql`lower(${appUser.account})`, account.toLowerCase()));
  return row;
}

export async function requireUser(id: string): Promise<UserRow> {
  const row = await findUserById(id);
  if (!row) throw notFound('User');
  return row;
}

export function listUsers(): Promise<UserRow[]> {
  return db.select().from(appUser).orderBy(asc(appUser.createdAt));
}

export async function createUser(account: string, password: string): Promise<UserRow> {
  assertNotRootName(account);
  const passwordHash = await hashPassword(password);
  const [row] = await translateUniqueViolation(db.insert(appUser).values({ account, passwordHash }).returning());
  return row!;
}

export async function renameUser(id: string, account: string): Promise<UserRow> {
  assertNotRootName(account);
  const [row] = await translateUniqueViolation(db.update(appUser).set({ account }).where(eq(appUser.id, id)).returning());
  if (!row) throw notFound('User');
  return row;
}

/** Replaces the password and bumps the session epoch, which signs out every existing session of that user. */
export async function replacePassword(id: string, password: string): Promise<UserRow> {
  const passwordHash = await hashPassword(password);
  const [row] = await db.update(appUser)
    .set({ passwordHash, sessionEpoch: sql`${appUser.sessionEpoch} + 1` })
    .where(eq(appUser.id, id))
    .returning();
  if (!row) throw notFound('User');
  return row;
}

/** Returns the avatar image the user held, so the caller can release the file once nothing else uses it. */
export async function deleteUser(id: string): Promise<string | null> {
  return db.transaction(async transaction => {
    const [avatar] = await transaction.delete(userAvatar).where(eq(userAvatar.userId, id)).returning({ imageSha256: userAvatar.imageSha256 });
    const [removed] = await transaction.delete(appUser).where(eq(appUser.id, id)).returning({ id: appUser.id });
    if (!removed) throw notFound('User');
    return avatar?.imageSha256 ?? null;
  });
}
