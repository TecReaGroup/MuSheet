import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { appConfig } from '../../config/app-config';

// Stateless signed tokens survive `node --watch` restarts without a session table.
// The key is derived from root's credentials so changing root's password in .env
// revokes every outstanding session; forging one already requires knowing that password.
const SIGNING_KEY = createHash('sha256')
  .update(`musheet-session\0${appConfig.admin.account}\0${appConfig.admin.password}`)
  .digest();

/**
 * What a token proves: who logged in, and which credential generation they used.
 * A password change bumps the user's epoch, which invalidates tokens carrying the old one.
 */
export interface SessionClaim {
  userId: string;
  epoch: number;
}

function digest(text: string) {
  return createHash('sha256').update(text).digest();
}

function sign(payload: string) {
  return createHmac('sha256', SIGNING_KEY).update(payload).digest('base64url');
}

/** Compares via fixed-length digests so neither length nor content leaks through timing. */
export function equalsInConstantTime(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

/** Token format: `<userId>.<epoch>.<expiresAtMs>.<hmac>`; user ids never contain a dot. */
export function issueSessionToken(claim: SessionClaim, now = Date.now()) {
  const payload = `${claim.userId}.${claim.epoch}.${now + appConfig.sessionTtlMs}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string, now = Date.now()): SessionClaim | undefined {
  const [userId, epoch, expiresAt, signature] = token.split('.');
  if (!userId || !epoch || !expiresAt || !signature) return undefined;
  const isAuthentic = equalsInConstantTime(signature, sign(`${userId}.${epoch}.${expiresAt}`));
  if (!isAuthentic || Number(expiresAt) <= now) return undefined;
  return { userId, epoch: Number(epoch) };
}
