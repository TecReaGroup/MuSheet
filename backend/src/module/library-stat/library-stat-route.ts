import type { FastifyInstance } from 'fastify';
import { requireRootAccount } from '../auth/auth-route';
import { readLibraryStat } from './library-stat-repository';

/** Root-only overview of how much the server stores. */
export async function registerLibraryStatRoutes(app: FastifyInstance) {
  app.get('/api/library-stat', async request => {
    requireRootAccount(request);
    return readLibraryStat();
  });
}
