import type { Readable } from 'node:stream';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { accountRenameRequestSchema, avatarPresetRequestSchema, passwordChangeRequestSchema } from '../../../../contract/api';
import { HttpError } from '../../http/http-error';
import { log } from '../../infrastructure/logger';
import { sessionAccountOf, startSession } from '../auth/auth-route';
import { verifyPassword } from '../auth/password-hash';
import { toSessionAccount } from '../auth/session-account';
import { renameUser, replacePassword, requireUser } from '../user/user-repository';
import { choosePresetAvatar, resetAvatar, uploadImageAvatar } from './avatar-repository';
import { describeSession } from './session-view';

/** Root's name and password come from .env; editing them here would silently diverge from the file. */
function requireEditableAccount(request: FastifyRequest) {
  const account = sessionAccountOf(request);
  if (account.isRoot) throw new HttpError(403, 'root_immutable', 'Root credentials are managed in .env');
  return account;
}

/** Self-service for the signed-in account: name, password and avatar. */
export async function registerAccountRoutes(app: FastifyInstance) {
  app.put('/api/account/name', async request => {
    const { id } = requireEditableAccount(request);
    const { account } = accountRenameRequestSchema.parse(request.body);
    const user = await renameUser(id, account);
    log('info', 'Account', 'Renamed account', { userId: id });
    return describeSession(toSessionAccount(user));
  });

  app.put('/api/account/password', async (request, reply) => {
    const { id } = requireEditableAccount(request);
    const { currentPassword, newPassword } = passwordChangeRequestSchema.parse(request.body);
    const current = await requireUser(id);
    if (!(await verifyPassword(currentPassword, current.passwordHash))) {
      throw new HttpError(400, 'wrong_password', 'Current password is incorrect');
    }
    const user = await replacePassword(id, newPassword);
    // The epoch bump signs out other devices; re-issuing keeps this one signed in.
    startSession(reply, toSessionAccount(user));
    log('info', 'Account', 'Changed password', { userId: id });
    return reply.code(204).send();
  });

  app.put('/api/account/avatar/preset', async request => {
    const account = sessionAccountOf(request);
    const { preset } = avatarPresetRequestSchema.parse(request.body);
    await choosePresetAvatar(account.id, preset);
    return describeSession(account);
  });

  app.put('/api/account/avatar/image', async request => {
    const account = sessionAccountOf(request);
    await uploadImageAvatar(account.id, request.body as Readable);
    return describeSession(account);
  });

  app.delete('/api/account/avatar', async request => {
    const account = sessionAccountOf(request);
    await resetAvatar(account.id);
    return describeSession(account);
  });
}
