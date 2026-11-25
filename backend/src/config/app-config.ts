import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { parse } from 'smol-toml';
import { z } from 'zod';
import { projectPath } from './project-path';

const BYTES_PER_MB = 1024 * 1024;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Matches the compose.yaml defaults so `make run` works against `make db` with zero setup.
const LOCAL_DATABASE_URL = 'postgres://musheet:musheet@localhost:5432/musheet';

const configFileSchema = z.object({
  server: z.object({ port: z.number().int().min(1).max(65535) }),
  storage: z.object({ data_dir: z.string().min(1), max_upload_mb: z.number().positive() }),
  log: z.object({ level: z.enum(['debug', 'info', 'warn', 'error']) }),
  auth: z.object({ session_days: z.number().positive() }),
});

const environmentSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1).default(LOCAL_DATABASE_URL),
  // Lowercase keys mirror the admin's .env exactly (`account = root`).
  account: z.string().trim().min(1),
  password: z.string().min(1),
});

function readEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    try {
      loadEnvFile(projectPath.envFile);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  return environmentSchema.parse(process.env);
}

function loadAppConfig() {
  const file = configFileSchema.parse(parse(readFileSync(projectPath.configFile, 'utf8')));
  const environment = readEnvironment();
  const dataDir = isAbsolute(file.storage.data_dir)
    ? file.storage.data_dir
    : join(projectPath.root, file.storage.data_dir);

  return {
    isProduction: environment.NODE_ENV === 'production',
    port: file.server.port,
    databaseUrl: environment.DATABASE_URL,
    dataDir,
    maxUploadBytes: file.storage.max_upload_mb * BYTES_PER_MB,
    logLevel: file.log.level,
    admin: { account: environment.account, password: environment.password },
    sessionTtlMs: file.auth.session_days * MS_PER_DAY,
  };
}

export type LogLevel = z.infer<typeof configFileSchema>['log']['level'];

export const appConfig = loadAppConfig();
