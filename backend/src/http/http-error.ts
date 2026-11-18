export class HttpError extends Error {
  constructor(readonly statusCode: number, readonly code: string, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFound(resource: string) {
  return new HttpError(404, 'not_found', `${resource} not found`);
}
