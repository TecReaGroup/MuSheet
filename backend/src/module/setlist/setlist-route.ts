import type { FastifyInstance } from 'fastify';
import {
  idParamSchema,
  listQuerySchema,
  setlistAppendRequestSchema,
  setlistCreateRequestSchema,
  setlistItemsRequestSchema,
  setlistUpdateRequestSchema,
} from '../../../../contract/api';
import {
  appendSetlistItem,
  createSetlist,
  deleteSetlist,
  getSetlistDetail,
  listSetlists,
  markSetlistOpened,
  replaceSetlistItems,
  updateSetlist,
} from './setlist-repository';

export async function registerSetlistRoutes(app: FastifyInstance) {
  app.get('/api/setlist', async request => listSetlists(listQuerySchema.parse(request.query)));

  app.post('/api/setlist', async (request, reply) => {
    const created = await createSetlist(setlistCreateRequestSchema.parse(request.body));
    return reply.code(201).send(created);
  });

  app.get('/api/setlist/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return getSetlistDetail(id);
  });

  app.patch('/api/setlist/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return updateSetlist(id, setlistUpdateRequestSchema.parse(request.body));
  });

  app.delete('/api/setlist/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await deleteSetlist(id);
    return reply.code(204).send();
  });

  app.post('/api/setlist/:id/open', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await markSetlistOpened(id);
    return reply.code(204).send();
  });

  app.put('/api/setlist/:id/item', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await replaceSetlistItems(id, setlistItemsRequestSchema.parse(request.body).scoreIds);
    return reply.code(204).send();
  });

  app.post('/api/setlist/:id/item', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await appendSetlistItem(id, setlistAppendRequestSchema.parse(request.body).scoreId);
    return reply.code(204).send();
  });
}
