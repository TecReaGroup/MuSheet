import { setTimeout as delay } from 'node:timers/promises';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginRequestSchema } from '../../../../contract/api';
import { appConfig } from '../../config/app-config';
import { HttpError } from '../../http/http-error';
import { log } from '../../infrastructure/logger';
import { describeSession } from '../account/session-view';
import { authenticate, resolveSessionAccount, type SessionAccount } from './session-account';
import { issueSessionToken, readSessionToken } from './session-token';

const SESSION_COOKIE = 'musheet_session';
// Slows online password guessing without needing a rate-limit store.
const FAILED_LOGIN_DELAY_MS = 800;
const PUBLIC_API_PATHS = new Set(['/api/health', '/api/auth/login', '/api/auth/logout']);

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the session guard for every protected path; null only on public paths. */
    sessionAccount: SessionAccount | null;
  }
}

function readSessionCookie(request: FastifyRequest) {
  const header = request.headers.cookie ?? '';
  for (const pair of header.split(';')) {
    const [name, ...value] = pair.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

// No `Secure` flag: the app is typically served over plain HTTP on a LAN to tablets.
function writeSessionCookie(reply: FastifyReply, token: string, maxAgeSeconds: number) {
  reply.header('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`);
}

/** Issues a fresh cookie for `account`; also used after a password change to keep the current device signed in. */
export function startSession(reply: FastifyReply, account: SessionAccount) {
  writeSessionCookie(reply, issueSessionToken({ userId: account.id, epoch: account.epoch }), Math.floor(appConfig.sessionTtlMs / 1000));
}

async function findRequestAccount(request: FastifyRequest) {
  const token = readSessionCookie(request);
  const claim = token === undefined ? undefined : readSessionToken(token);
  return claim && resolveSessionAccount(claim);
}

function isProtectedPath(path: string) {
  const isApiOrFile = path === '/api' || path.startsWith('/api/') || path.startsWith('/file/');
  return isApiOrFile && !PUBLIC_API_PATHS.has(path);
}

/** Every API call and stored file requires a session; the SPA shell stays public so the login page can load. */
export function installSessionGuard(app: FastifyInstance) {
  app.decorateRequest('sessionAccount', null);
  app.addHook('onRequest', async (request, reply) => {
    if (!isProtectedPath(request.url.split('?')[0])) return;
    const account = await findRequestAccount(request);
    if (!account) return reply.code(401).send({ error: 'unauthorized', message: 'Login required' });
    request.sessionAccount = account;
  });
}

/** Only valid inside protected routes, where the guard has already resolved the caller. */
export function sessionAccountOf(request: FastifyRequest): SessionAccount {
  if (!request.sessionAccount) throw new HttpError(401, 'unauthorized', 'Login required');
  return request.sessionAccount;
}

export function requireRootAccount(request: FastifyRequest): SessionAccount {
  const account = sessionAccountOf(request);
  if (!account.isRoot) throw new HttpError(403, 'forbidden', 'Only root can manage accounts');
  return account;
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const { account: accountName, password } = loginRequestSchema.parse(request.body);
    const account = await authenticate(accountName, password);
    if (!account) {
      log('warn', 'Auth', 'Login rejected', { requestId: request.id, ip: request.ip });
      await delay(FAILED_LOGIN_DELAY_MS);
      throw new HttpError(401, 'invalid_credentials', 'Account or password is incorrect');
    }
    startSession(reply, account);
    log('info', 'Auth', 'Login succeeded', { requestId: request.id, ip: request.ip, userId: account.id });
    return describeSession(account);
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    writeSessionCookie(reply, '', 0);
    return reply.code(204).send();
  });

  app.get('/api/auth/session', async request => describeSession(sessionAccountOf(request)));
}
