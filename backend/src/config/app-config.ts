import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { parse } from 'smol-toml';
import { z } from 'zod';
import { projectPath } from './project-path';

const BYTES_PER_MB = 1024 * 1024;

const configFileSchema = z.object({
  server: z.object({ port: z.number().int().min(1).max(65535) }),
  storage: z.object({ data_dir: z.string().min(1), max_upload_mb: z.number().positive() }),
  log: z.object({ level: z.enum(['debug', 'info', 'warn', 'error']) }),
});

const environmentSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1),
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
  };
}

export type LogLevel = z.infer<typeof configFileSchema>['log']['level'];

export const appConfig = loadAppConfig();
