import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '../../../contract/api';
import { FOREIGN_KEY_VIOLATION, postgresErrorCode, UNIQUE_VIOLATION } from '../db/postgres-error';
import { log, serializeError } from '../infrastructure/logger';
import { HttpError } from './http-error';

function toErrorBody(error: unknown): { status: number; body: ApiErrorBody } {
  if (error instanceof HttpError) {
    return { status: error.statusCode, body: { error: error.code, message: error.message } };
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return { status: 400, body: { error: 'invalid_request', message: `${issue?.path.join('.') || 'request'}: ${issue?.message}` } };
  }
  const sqlState = postgresErrorCode(error);
  if (sqlState === UNIQUE_VIOLATION) return { status: 409, body: { error: 'conflict', message: 'Resource already exists' } };
  if (sqlState === FOREIGN_KEY_VIOLATION) return { status: 400, body: { error: 'invalid_reference', message: 'Referenced resource does not exist' } };

  const fastifyError = error as Partial<FastifyError>;
  if (fastifyError.statusCode && fastifyError.statusCode < 500) {
    return { status: fastifyError.statusCode, body: { error: fastifyError.code ?? 'bad_request', message: fastifyError.message ?? 'Bad request' } };
  }
  return { status: 500, body: { error: 'internal', message: 'Internal server error' } };
}

export function sendErrorResponse(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  const { status, body } = toErrorBody(error);
  if (status >= 500) {
    log('error', 'HTTP', 'Request failed', {
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      error: serializeError(error),
    });
  }
  return reply.code(status).send(body);
}
