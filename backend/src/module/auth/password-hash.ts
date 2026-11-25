import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from 'node:crypto';

const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCHEME = 'scrypt';

// Node's scrypt defaults (N=16384, r=8, p=1) are OWASP's documented minimum; bcrypt/argon2 would add a native dependency.
function deriveKey(password: BinaryLike, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_BYTES, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/** Encodes as `scrypt$<salt>$<key>` (base64url) so the scheme can change later without a migration. */
export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt);
  return [SCHEME, salt.toString('base64url'), key.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, key] = encoded.split('$');
  if (scheme !== SCHEME || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64url');
  const actual = await deriveKey(password, Buffer.from(salt, 'base64url'));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Verifying against a throwaway hash keeps "unknown account" as slow as "wrong password".
const DECOY_HASH = hashPassword('musheet-decoy-password');

export async function burnPasswordCheck(password: string) {
  await verifyPassword(password, await DECOY_HASH);
}
