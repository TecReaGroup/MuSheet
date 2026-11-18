import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { appConfig, type LogLevel } from '../config/app-config';
import { projectPath } from '../config/project-path';

// Logs are always stamped in Singapore time regardless of the host timezone.
const TIMEZONE_OFFSET_MINUTES = 8 * 60;
const TIMEZONE_LABEL = '+08:00';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export type LogFields = Record<string, unknown>;

let fileLoggingAvailable = true;

function pad(value: number, length = 2) {
  return String(value).padStart(length, '0');
}

function toSingaporeParts(date: Date) {
  const shifted = new Date(date.getTime() + TIMEZONE_OFFSET_MINUTES * 60_000);
  return {
    day: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`,
  };
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return /[\s,=]/u.test(value) ? JSON.stringify(value) : value;
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return String(value);
  return JSON.stringify(value);
}

function formatFieldValue(key: string, value: unknown) {
  if (key === 'requestId' && typeof value === 'string') return value.slice(0, 8);
  if (key === 'size' && typeof value === 'number') {
    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`;
    return `${value}B`;
  }
  if (key === 'durationMs' && typeof value === 'number') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`;
  }
  return formatValue(value);
}

function formatFields(fields: LogFields) {
  const values: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (key === 'error' && value && typeof value === 'object') {
      for (const [errorKey, errorValue] of Object.entries(value)) {
        if (errorValue !== undefined) values.push(`${errorKey}=${formatFieldValue(errorKey, errorValue)}`);
      }
      continue;
    }
    values.push(`${key}=${formatFieldValue(key, value)}`);
  }
  return values.length > 0 ? ` ${values.join(', ')}` : '';
}

function writeConsole(level: LogLevel, entry: string) {
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
}

export function serializeError(error: unknown): LogFields {
  if (!(error instanceof Error)) return { message: String(error) };
  const diagnostic = error as Error & { code?: unknown; statusCode?: unknown; cause?: unknown };
  return {
    message: error.message,
    code: diagnostic.code,
    statusCode: diagnostic.statusCode,
    cause: diagnostic.cause instanceof Error ? diagnostic.cause.message : undefined,
    stack: appConfig.isProduction ? undefined : error.stack?.split('\n').slice(1, 4).join(' | '),
  };
}

try {
  mkdirSync(projectPath.log, { recursive: true });
} catch (error) {
  fileLoggingAvailable = false;
  console.error(`Cannot create log directory ${projectPath.log}: ${String(error)}`);
}

export function log(level: LogLevel, module: string, message: string, fields: LogFields = {}) {
  if (LEVEL_RANK[level] < LEVEL_RANK[appConfig.logLevel]) return;

  const { day, time } = toSingaporeParts(new Date());
  const entry = `[${day} ${time} ${TIMEZONE_LABEL}] [${level.toUpperCase()}] [${module}] - ${message}${formatFields(fields)}`;
  writeConsole(level, entry);

  if (!fileLoggingAvailable) return;
  try {
    appendFileSync(join(projectPath.log, `log_${day}.log`), `${entry}\n`, 'utf8');
  } catch (error) {
    fileLoggingAvailable = false;
    console.error(`Cannot write log file: ${String(error)}`);
  }
}
