import { buildApp } from './src/app';
import { appConfig } from './src/config/app-config';
import { sqlClient } from './src/db/client';
import { applyMigrations } from './src/db/migrate';
import { ensureStorageDirs } from './src/infrastructure/file-storage';
import { log, serializeError } from './src/infrastructure/logger';
import { sweepOrphanPdfs } from './src/module/pdf/pdf-repository';

async function start() {
  await ensureStorageDirs();
  await applyMigrations();
  await sweepOrphanPdfs();

  const app = await buildApp();
  await app.listen({ port: appConfig.port, host: '0.0.0.0' });
  log('info', 'Server', 'Server started', {
    port: appConfig.port,
    environment: appConfig.isProduction ? 'production' : 'development',
  });

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, async () => {
      log('info', 'Server', 'Shutting down', { signal });
      try {
        await app.close();
        await sqlClient.end({ timeout: 5 });
        log('info', 'Server', 'Server stopped', { signal });
      } catch (error) {
        log('error', 'Server', 'Shutdown failed', { signal, error: serializeError(error) });
        process.exitCode = 1;
      }
    });
  }
}

start().catch(error => {
  log('error', 'Server', 'Startup failed', { error: serializeError(error) });
  process.exit(1);
});
