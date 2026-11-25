import type { FastifyInstance } from 'fastify';
import { tagListRequestSchema } from '../../../../contract/api';
import { log } from '../../infrastructure/logger';
import { listTags, replaceTags } from './tag-repository';

/** One tag list shared by every account. */
export async function registerTagRoutes(app: FastifyInstance) {
  app.get('/api/tag', async () => listTags());

  app.put('/api/tag', async request => {
    const { tags } = tagListRequestSchema.parse(request.body);
    const saved = await replaceTags(tags);
    log('info', 'Tag', 'Replaced tag list', { count: saved.length });
    return saved;
  });
}
