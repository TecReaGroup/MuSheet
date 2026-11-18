import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

export const projectPath = {
  root: PROJECT_ROOT,
  configFile: join(PROJECT_ROOT, 'config', 'config.toml'),
  envFile: join(PROJECT_ROOT, '.env'),
  dist: join(PROJECT_ROOT, 'dist'),
  log: join(PROJECT_ROOT, 'log'),
  temp: join(PROJECT_ROOT, 'temp'),
  migration: fileURLToPath(new URL('../db/migration/', import.meta.url)),
};
