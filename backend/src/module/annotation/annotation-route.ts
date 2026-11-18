import type { FastifyInstance } from 'fastify';
import { annotationPageParamSchema, annotationPageRequestSchema, idParamSchema } from '../../../../contract/api';
import { getAnnotationBook, saveAnnotationPage } from './annotation-repository';

export async function registerAnnotationRoutes(app: FastifyInstance) {
  app.get('/api/part/:id/annotation', async request => {
    const { id } = idParamSchema.parse(request.params);
    return getAnnotationBook(id);
  });

  app.put('/api/part/:id/annotation/:page', async (request, reply) => {
    const { id, page } = annotationPageParamSchema.parse(request.params);
    const { strokes } = annotationPageRequestSchema.parse(request.body);
    await saveAnnotationPage(id, page, strokes);
    return reply.code(204).send();
  });
}
