import type { FastifyInstance } from 'fastify';
import { partNameListRequestSchema } from '../../../../contract/api';
import { log } from '../../infrastructure/logger';
import { listPartNames, replacePartNames } from './part-name-repository';

/** One part name list shared by every account. */
export async function registerPartNameRoutes(app: FastifyInstance) {
  app.get('/api/part-name', async () => listPartNames());

  app.put('/api/part-name', async request => {
    const { names } = partNameListRequestSchema.parse(request.body);
    const saved = await replacePartNames(names);
    log('info', 'Part', 'Replaced part name list', { count: saved.length });
    return saved;
  });
}
