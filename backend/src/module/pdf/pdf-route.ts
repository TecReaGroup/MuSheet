import type { Readable } from 'node:stream';
import type { FastifyInstance } from 'fastify';
import { pdfUploadQuerySchema, sha256ParamSchema } from '../../../../contract/api';
import { findPdf, storePdf, storeThumbnail } from './pdf-repository';

export async function registerPdfRoutes(app: FastifyInstance) {
  app.get('/api/pdf/:sha256', async request => {
    const { sha256 } = sha256ParamSchema.parse(request.params);
    return findPdf(sha256);
  });

  app.put('/api/pdf/:sha256', async (request, reply) => {
    const { sha256 } = sha256ParamSchema.parse(request.params);
    const { pageCount } = pdfUploadQuerySchema.parse(request.query);
    const view = await storePdf(sha256, pageCount, request.body as Readable);
    return reply.code(201).send(view);
  });

  app.put('/api/pdf/:sha256/thumbnail', async (request, reply) => {
    const { sha256 } = sha256ParamSchema.parse(request.params);
    await storeThumbnail(sha256, request.body as Readable);
    return reply.code(204).send();
  });
}
