type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogFields = Record<string, string | number | boolean | null | undefined>;

// Matches the server log format and its fixed Singapore timezone.
const TIMEZONE_OFFSET_MINUTES = 8 * 60;
const CLIENT_LOG_ENDPOINT = '/api/client-log';

function redactLogText(text: string): string {
  return text.replace(/https?:\/\/[^\s"'<>]+/gi, address => {
    try {
      const url = new URL(address);
      return `${url.origin}${url.pathname}`;
    } catch { return '[redacted URL]'; }
  }).replace(/\b(password|token|authorization|cookie|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]');
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatTimestamp(date: Date) {
  const shifted = new Date(date.getTime() + TIMEZONE_OFFSET_MINUTES * 60_000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} `
    + `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())} +08:00`;
}

export function serializeError(error: unknown): LogFields {
  if (!(error instanceof Error)) return { message: typeof error === 'string' ? redactLogText(error) : 'Unknown error' };
  const diagnostic = error as Error & { code?: string | number; status?: number; cause?: unknown };
  return {
    name: error.name,
    message: redactLogText(error.message),
    stack: error.stack && redactLogText(error.stack.split('\n').slice(0, 4).join(' | ')),
    code: diagnostic.code,
    status: diagnostic.status,
    cause: diagnostic.cause instanceof Error ? redactLogText(diagnostic.cause.message) : undefined,
  };
}

function reportToServer(level: 'warn' | 'error', module: string, message: string, fields: LogFields) {
  const body = JSON.stringify({ level, module, message, fields });
  // Fire-and-forget: a failing report must never trigger another log/report cycle.
  fetch(CLIENT_LOG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    .catch(() => undefined);
}

// DEBUG: request lifecycle/cancellation; INFO: completed milestones;
// WARN: recoverable failures; ERROR: failed operations. Log once at the owning boundary.
// Fields must be diagnostic scalars, never credentials, bodies, search terms or raw URLs.
export function log(level: LogLevel, module: string, message: string, fields: LogFields = {}) {
  const safeFields = Object.fromEntries(Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, /password|token|authorization|cookie|secret/i.test(key)
      ? '[redacted]' : typeof value === 'string' ? redactLogText(value) : value])) as LogFields;
  console[level](`[${formatTimestamp(new Date())}] [${level.toUpperCase()}] [${module}] - ${message}`, safeFields);
  if (level === 'error') reportToServer(level, module, message, safeFields);
}
