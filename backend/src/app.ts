import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { sep } from 'node:path';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { appConfig } from './config/app-config';
import { projectPath } from './config/project-path';
import { sendErrorResponse } from './http/error-response';
import { log, type LogFields } from './infrastructure/logger';
import { registerAnnotationRoutes } from './module/annotation/annotation-route';
import { registerAccountRoutes } from './module/account/account-route';
import { installSessionGuard, registerAuthRoutes } from './module/auth/auth-route';
import { registerClientLogRoutes } from './module/client-log/client-log-route';
import { registerLibraryStatRoutes } from './module/library-stat/library-stat-route';
import { registerPartNameRoutes } from './module/part/part-name-route';
import { registerPartRoutes } from './module/part/part-route';
import { registerPdfRoutes } from './module/pdf/pdf-route';
import { registerScoreRoutes } from './module/score/score-route';
import { registerSetlistRoutes } from './module/setlist/setlist-route';
import { registerUserRoutes } from './module/user/user-route';

// Annotation pages with many dense strokes exceed Fastify's 1MB default.
const JSON_BODY_LIMIT_BYTES = 8 * 1024 * 1024;
const BINARY_UPLOAD_TYPES = ['application/pdf', 'image/jpeg'];

function logResponse(request: FastifyRequest, reply: FastifyReply, done: () => void) {
  const status = reply.statusCode;
  const isRead = request.method === 'GET' || request.method === 'HEAD';
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : isRead ? 'debug' : 'info';
  // Route patterns instead of raw URLs keep search terms and ids out of the log.
  const fields: LogFields = { requestId: request.id, status, durationMs: Math.round(reply.elapsedTime) };
  log(level, 'HTTP', `${request.method} ${request.routeOptions.url ?? request.url.split('?')[0]}`, fields);
  done();
}

function isApiOrFile(url: string) {
  return url.startsWith('/api/') || url === '/api' || url.startsWith('/file/');
}

export async function buildApp() {
  const app = Fastify({ logger: false, bodyLimit: JSON_BODY_LIMIT_BYTES, genReqId: () => randomUUID() });

  // Uploads arrive as raw bodies and are streamed (hashed + size-limited) by the PDF module.
  app.addContentTypeParser(BINARY_UPLOAD_TYPES, (_request, payload, done) => done(null, payload));
  app.setErrorHandler(sendErrorResponse);
  app.addHook('onResponse', logResponse);
  installSessionGuard(app);

  app.get('/api/health', async () => ({ status: 'ok' }));
  await app.register(registerAuthRoutes);
  await app.register(registerAccountRoutes);
  await app.register(registerUserRoutes);
  await app.register(registerScoreRoutes);
  await app.register(registerPartRoutes);
  await app.register(registerPdfRoutes);
  await app.register(registerAnnotationRoutes);
  await app.register(registerSetlistRoutes);
  await app.register(registerPartNameRoutes);
  await app.register(registerLibraryStatRoutes);
  await app.register(registerClientLogRoutes);

  // Stored files are content-addressed by SHA-256, so they can be cached forever.
  await app.register(fastifyStatic, {
    root: appConfig.dataDir,
    prefix: '/file/',
    decorateReply: false,
    index: false,
    maxAge: '365d',
    immutable: true,
  });

  const hasFrontendBuild = existsSync(projectPath.dist);
  if (hasFrontendBuild) {
    await app.register(fastifyStatic, {
      root: projectPath.dist,
      prefix: '/',
      index: false,
      setHeaders: (response, filePath) => {
        const isHashedAsset = filePath.includes(`${sep}assets${sep}`);
        response.setHeader('Cache-Control', isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    });
  }

  app.setNotFoundHandler((request, reply) => {
    if (hasFrontendBuild && request.method === 'GET' && !isApiOrFile(request.url)) {
      return reply.header('Cache-Control', 'no-cache').sendFile('index.html');
    }
    return reply.code(404).send({ error: 'not_found', message: 'Route not found' });
  });

  return app;
}
