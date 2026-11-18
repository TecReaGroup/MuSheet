import type { FastifyInstance } from 'fastify';
import {
  idParamSchema,
  listQuerySchema,
  partCreateRequestSchema,
  partOrderRequestSchema,
  scoreImportRequestSchema,
  scoreUpdateRequestSchema,
} from '../../../../contract/api';
import { addPart, reorderParts } from '../part/part-repository';
import { deleteScore, getScoreDetail, importScore, listScores, markScoreOpened, updateScore } from './score-repository';

export async function registerScoreRoutes(app: FastifyInstance) {
  app.get('/api/score', async request => listScores(listQuerySchema.parse(request.query)));

  app.post('/api/score/import', async (request, reply) => {
    const created = await importScore(scoreImportRequestSchema.parse(request.body));
    return reply.code(201).send(created);
  });

  app.get('/api/score/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return getScoreDetail(id);
  });

  app.patch('/api/score/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return updateScore(id, scoreUpdateRequestSchema.parse(request.body));
  });

  app.delete('/api/score/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await deleteScore(id);
    return reply.code(204).send();
  });

  app.post('/api/score/:id/open', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await markScoreOpened(id);
    return reply.code(204).send();
  });

  app.post('/api/score/:id/part', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const created = await addPart(id, partCreateRequestSchema.parse(request.body));
    return reply.code(201).send(created);
  });

  app.put('/api/score/:id/part-order', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await reorderParts(id, partOrderRequestSchema.parse(request.body).partIds);
    return reply.code(204).send();
  });
}
