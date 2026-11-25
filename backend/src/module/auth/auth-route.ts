import { setTimeout as delay } from 'node:timers/promises';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { loginRequestSchema, type SessionView } from '../../../../contract/api';
import { appConfig } from '../../config/app-config';
import { HttpError } from '../../http/http-error';
import { log } from '../../infrastructure/logger';
import { isAdminCredential, isValidSessionToken, issueSessionToken } from './admin-session';

const SESSION_COOKIE = 'musheet_session';
// Slows online password guessing without needing a rate-limit store.
const FAILED_LOGIN_DELAY_MS = 800;
const PUBLIC_API_PATHS = new Set(['/api/health', '/api/auth/login', '/api/auth/logout']);

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

function hasValidSession(request: FastifyRequest) {
  const token = readSessionCookie(request);
  return token !== undefined && isValidSessionToken(token);
}

function isProtectedPath(path: string) {
  const isApiOrFile = path === '/api' || path.startsWith('/api/') || path.startsWith('/file/');
  return isApiOrFile && !PUBLIC_API_PATHS.has(path);
}

/** onRequest guard: every API call and stored file requires a session; the SPA shell stays public so the login page can load. */
export async function requireAdminSession(request: FastifyRequest, reply: FastifyReply) {
  if (!isProtectedPath(request.url.split('?')[0]) || hasValidSession(request)) return;
  return reply.code(401).send({ error: 'unauthorized', message: 'Login required' });
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const { account, password } = loginRequestSchema.parse(request.body);
    if (!isAdminCredential(account, password)) {
      log('warn', 'Auth', 'Login rejected', { requestId: request.id, ip: request.ip });
      await delay(FAILED_LOGIN_DELAY_MS);
      throw new HttpError(401, 'invalid_credentials', 'Account or password is incorrect');
    }
    writeSessionCookie(reply, issueSessionToken(), Math.floor(appConfig.sessionTtlMs / 1000));
    log('info', 'Auth', 'Login succeeded', { requestId: request.id, ip: request.ip });
    return { account: appConfig.admin.account } satisfies SessionView;
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    writeSessionCookie(reply, '', 0);
    return reply.code(204).send();
  });

  // Reaching this handler means requireAdminSession already accepted the cookie.
  app.get('/api/auth/session', async () => ({ account: appConfig.admin.account }) satisfies SessionView);
}
