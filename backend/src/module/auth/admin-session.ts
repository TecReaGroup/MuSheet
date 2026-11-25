import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { appConfig } from '../../config/app-config';

// Stateless signed tokens survive `node --watch` restarts without a session table.
// The key is derived from the admin credentials so changing the password in .env
// revokes every outstanding session; forging one already requires knowing the password.
const SIGNING_KEY = createHash('sha256')
  .update(`musheet-session\0${appConfig.admin.account}\0${appConfig.admin.password}`)
  .digest();

function digest(text: string) {
  return createHash('sha256').update(text).digest();
}

function sign(payload: string) {
  return createHmac('sha256', SIGNING_KEY).update(payload).digest('base64url');
}

/** Compares via fixed-length digests so neither length nor content leaks through timing. */
function equalsInConstantTime(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

export function isAdminCredential(account: string, password: string) {
  const accountMatches = equalsInConstantTime(account, appConfig.admin.account);
  const passwordMatches = equalsInConstantTime(password, appConfig.admin.password);
  return accountMatches && passwordMatches;
}

/** Token format: `<expiresAtMs>.<hmac>`; the account is implied because there is only one admin. */
export function issueSessionToken(now = Date.now()) {
  const payload = String(now + appConfig.sessionTtlMs);
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string, now = Date.now()) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  return equalsInConstantTime(signature, sign(payload)) && Number(payload) > now;
}
