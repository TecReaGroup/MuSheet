import type { FastifyInstance } from 'fastify';
import { idParamSchema } from '../../../../contract/api';
import { sessionAccountOf } from '../auth/auth-route';
import { visibleSpaceKeys } from '../space/space-key';
import { deletePart, getViewerPart } from './part-repository';

export async function registerPartRoutes(app: FastifyInstance) {
  app.get('/api/part/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return getViewerPart(id, visibleSpaceKeys(sessionAccountOf(request)));
  });

  app.delete('/api/part/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await deletePart(id, visibleSpaceKeys(sessionAccountOf(request)));
    return reply.code(204).send();
  });
}
