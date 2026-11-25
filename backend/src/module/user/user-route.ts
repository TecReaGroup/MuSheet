import type { FastifyInstance } from 'fastify';
import { userCreateRequestSchema, userIdParamSchema, userPasswordResetRequestSchema, type ManagedUserView } from '../../../../contract/api';
import { log } from '../../infrastructure/logger';
import { findAvatars, releaseAvatarImage } from '../account/avatar-repository';
import { requireRootAccount } from '../auth/auth-route';
import { deleteSpaceLibrary } from '../score/score-repository';
import { createUser, deleteUser, listUsers, replacePassword, type UserRow } from './user-repository';

async function toManagedUserViews(users: UserRow[]): Promise<ManagedUserView[]> {
  const avatars = await findAvatars(users.map(user => user.id));
  return users.map(user => ({
    id: user.id,
    account: user.account,
    avatar: avatars.get(user.id)!,
    createdAt: user.createdAt.toISOString(),
  }));
}

/** Root-only account administration. */
export async function registerUserRoutes(app: FastifyInstance) {
  app.get('/api/user', async request => {
    requireRootAccount(request);
    return toManagedUserViews(await listUsers());
  });

  app.post('/api/user', async (request, reply) => {
    requireRootAccount(request);
    const { account, password } = userCreateRequestSchema.parse(request.body);
    const user = await createUser(account, password);
    log('info', 'User', 'Created user', { userId: user.id });
    const [view] = await toManagedUserViews([user]);
    return reply.code(201).send(view);
  });

  app.put('/api/user/:userId/password', async (request, reply) => {
    requireRootAccount(request);
    const { userId } = userIdParamSchema.parse(request.params);
    const { password } = userPasswordResetRequestSchema.parse(request.body);
    await replacePassword(userId, password);
    log('info', 'User', 'Reset password', { userId });
    return reply.code(204).send();
  });

  app.delete('/api/user/:userId', async (request, reply) => {
    requireRootAccount(request);
    const { userId } = userIdParamSchema.parse(request.params);
    await releaseAvatarImage(await deleteUser(userId));
    // The personal library goes with its owner; team content stays because it belongs to everyone.
    await deleteSpaceLibrary(userId);
    log('info', 'User', 'Deleted user', { userId });
    return reply.code(204).send();
  });
}
