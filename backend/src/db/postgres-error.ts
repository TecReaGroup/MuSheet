export const UNIQUE_VIOLATION = '23505';
export const FOREIGN_KEY_VIOLATION = '23503';

/** Drizzle wraps driver errors in DrizzleQueryError, so the SQLSTATE may sit on `cause`. */
export function postgresErrorCode(error: unknown): string | undefined {
  const candidate = error as { code?: unknown; cause?: { code?: unknown } } | null;
  const code = candidate?.code ?? candidate?.cause?.code;
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) ? code : undefined;
}
