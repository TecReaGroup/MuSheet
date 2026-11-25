import type { FastifyInstance } from 'fastify';
import {
  idParamSchema,
  listQuerySchema,
  setlistAppendRequestSchema,
  setlistCreateRequestSchema,
  setlistItemsRequestSchema,
  setlistUpdateRequestSchema,
  teamSetlistCopyRequestSchema,
} from '../../../../contract/api';
import { sessionAccountOf } from '../auth/auth-route';
import { spaceKeyOf, visibleSpaceKeys } from '../space/space-key';
import {
  appendSetlistItem,
  copySetlistsToTeam,
  createSetlist,
  deleteSetlist,
  getSetlistDetail,
  listSetlists,
  markSetlistOpened,
  replaceSetlistItems,
  updateSetlist,
} from './setlist-repository';

export async function registerSetlistRoutes(app: FastifyInstance) {
  app.get('/api/setlist', async request => {
    const query = listQuerySchema.parse(request.query);
    return listSetlists(spaceKeyOf(sessionAccountOf(request), query.space), query);
  });

  app.post('/api/setlist', async (request, reply) => {
    const { space, ...setlistCreate } = setlistCreateRequestSchema.parse(request.body);
    const created = await createSetlist(spaceKeyOf(sessionAccountOf(request), space), setlistCreate);
    return reply.code(201).send(created);
  });

  app.post('/api/setlist/team-copy', async (request, reply) => {
    const { setlistIds } = teamSetlistCopyRequestSchema.parse(request.body);
    const copies = await copySetlistsToTeam(sessionAccountOf(request).id, setlistIds);
    return reply.code(201).send(copies);
  });

  app.get('/api/setlist/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return getSetlistDetail(id, visibleSpaceKeys(sessionAccountOf(request)));
  });

  app.patch('/api/setlist/:id', async request => {
    const { id } = idParamSchema.parse(request.params);
    return updateSetlist(id, visibleSpaceKeys(sessionAccountOf(request)), setlistUpdateRequestSchema.parse(request.body));
  });

  app.delete('/api/setlist/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await deleteSetlist(id, visibleSpaceKeys(sessionAccountOf(request)));
    return reply.code(204).send();
  });

  app.post('/api/setlist/:id/open', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await markSetlistOpened(id, visibleSpaceKeys(sessionAccountOf(request)));
    return reply.code(204).send();
  });

  app.put('/api/setlist/:id/item', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await replaceSetlistItems(id, visibleSpaceKeys(sessionAccountOf(request)), setlistItemsRequestSchema.parse(request.body).scoreIds);
    return reply.code(204).send();
  });

  app.post('/api/setlist/:id/item', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await appendSetlistItem(id, visibleSpaceKeys(sessionAccountOf(request)), setlistAppendRequestSchema.parse(request.body).scoreId);
    return reply.code(204).send();
  });
}
