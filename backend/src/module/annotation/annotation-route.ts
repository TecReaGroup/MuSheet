import type { FastifyInstance } from 'fastify';
import { annotationPageParamSchema, annotationPageRequestSchema, idParamSchema } from '../../../../contract/api';
import { sessionAccountOf } from '../auth/auth-route';
import { visibleSpaceKeys } from '../space/space-key';
import { getAnnotationBook, saveAnnotationPage } from './annotation-repository';

export async function registerAnnotationRoutes(app: FastifyInstance) {
  app.get('/api/part/:id/annotation', async request => {
    const { id } = idParamSchema.parse(request.params);
    return getAnnotationBook(id, visibleSpaceKeys(sessionAccountOf(request)));
  });

  app.put('/api/part/:id/annotation/:page', async (request, reply) => {
    const { id, page } = annotationPageParamSchema.parse(request.params);
    const { strokes } = annotationPageRequestSchema.parse(request.body);
    await saveAnnotationPage(id, visibleSpaceKeys(sessionAccountOf(request)), page, strokes);
    return reply.code(204).send();
  });
}
