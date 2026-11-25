import type { FastifyInstance } from 'fastify';
import {
  idParamSchema,
  listQuerySchema,
  partCreateRequestSchema,
  partOrderRequestSchema,
  scoreImportRequestSchema,
  scoreUpdateRequestSchema,
  teamCopyRequestSchema,
} from '../../../../contract/api';
import { sessionAccountOf } from '../auth/auth-route';
import { addPart, reorderParts } from '../part/part-repository';
import { spaceKeyOf, visibleSpaceKeys } from '../space/space-key';
import {
  copyScoresToTeam,
  deleteScore,
  getScoreDetail,
  importScore,
  listScores,
  markScoreOpened,
  updateScore,
} from './score-repository';

export async function registerScoreRoutes(app: FastifyInstance) {
  app.get('/api/score', async request => {
    const query = listQuerySchema.parse(request.query);
    return listScores(spaceKeyOf(sessionAccountOf(request), query.space), query);
  });

  app.post('/api/score/import', async (request, reply) => {
    const { space, ...scoreImport } = scoreImportRequestSchema.parse(request.body);
    const created = await importScore(spaceKeyOf(sessionAccountOf(request), space), scoreImport);
    return reply.code(201).send(created);
  });

  app.post('/api/score/team-copy', async (request, reply) => {
    const { scoreIds } = teamCopyRequestSchema.parse(request.body);
    const copies = await copyScoresToTeam(sessionAccountOf(request).id, scoreIds);
    return reply.code(201).send(copies);
  });

  app.get('/api/score/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return getScoreDetail(id, visibleSpaceKeys(sessionAccountOf(request)));
  });

  app.patch('/api/score/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return updateScore(id, visibleSpaceKeys(sessionAccountOf(request)), scoreUpdateRequestSchema.parse(request.body));
  });

  app.delete('/api/score/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await deleteScore(id, visibleSpaceKeys(sessionAccountOf(request)));
    return reply.code(204).send();
  });

  app.post('/api/score/:id/open', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await markScoreOpened(id, visibleSpaceKeys(sessionAccountOf(request)));
    return reply.code(204).send();
  });

  app.post('/api/score/:id/part', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const created = await addPart(id, visibleSpaceKeys(sessionAccountOf(request)), partCreateRequestSchema.parse(request.body));
    return reply.code(201).send(created);
  });

  app.put('/api/score/:id/part-order', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await reorderParts(id, visibleSpaceKeys(sessionAccountOf(request)), partOrderRequestSchema.parse(request.body).partIds);
    return reply.code(204).send();
  });
}
