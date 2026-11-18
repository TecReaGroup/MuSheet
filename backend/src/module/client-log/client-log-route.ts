import type { FastifyInstance } from 'fastify';
import { clientLogRequestSchema } from '../../../../contract/api';
import { log } from '../../infrastructure/logger';

/** Persists browser warnings/errors into the same daily log files as the server. */
export async function registerClientLogRoutes(app: FastifyInstance) {
  app.post('/api/client-log', async (request, reply) => {
    const entry = clientLogRequestSchema.parse(request.body);
    log(entry.level, `Web:${entry.module}`, entry.message, entry.fields);
    return reply.code(204).send();
  });
}
