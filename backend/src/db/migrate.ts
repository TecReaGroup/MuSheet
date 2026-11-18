import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectPath } from '../config/project-path';
import { log } from '../infrastructure/logger';
import { sqlClient } from './client';

// Plain ordered .sql files tracked in schema_migration. Rejected drizzle-kit migrations:
// they need a generated journal and a CLI step, which is more machinery than a single-user app needs.
export async function applyMigrations() {
  await sqlClient`
    create table if not exists schema_migration (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
  const appliedRows = await sqlClient<{ name: string }[]>`select name from schema_migration`;
  const applied = new Set(appliedRows.map(row => row.name));
  const pending = (await readdir(projectPath.migration))
    .filter(name => name.endsWith('.sql') && !applied.has(name))
    .sort();

  for (const name of pending) {
    const statements = await readFile(join(projectPath.migration, name), 'utf8');
    await sqlClient.begin(async transaction => {
      await transaction.unsafe(statements).simple();
      await transaction`insert into schema_migration (name) values (${name})`;
    });
    log('info', 'Migration', 'Applied migration', { name });
  }
}
