import { asc } from 'drizzle-orm';
import { db } from '../../db/client';
import { partName } from '../../db/schema';

export async function listPartNames(): Promise<string[]> {
  const rows = await db.select({ name: partName.name }).from(partName).orderBy(asc(partName.position));
  return rows.map(row => row.name);
}

/** Replaces the whole shared list; existing parts keep their name even when it leaves the list. */
export async function replacePartNames(names: string[]): Promise<string[]> {
  await db.transaction(async transaction => {
    await transaction.delete(partName);
    await transaction.insert(partName).values(names.map((name, position) => ({ name, position })));
  });
  return names;
}
