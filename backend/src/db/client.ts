import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from '../config/app-config';
import * as schema from './schema';

export const sqlClient = postgres(appConfig.databaseUrl, { max: 10, onnotice: () => {} });

export const db = drizzle(sqlClient, { schema });

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = typeof db | DbTransaction;
