import { asc } from 'drizzle-orm';
import { db } from '../../db/client';
import { partTag } from '../../db/schema';

export async function listTags(): Promise<string[]> {
  const rows = await db.select({ name: partTag.name }).from(partTag).orderBy(asc(partTag.position));
  return rows.map(row => row.name);
}

/** Replaces the whole shared list; existing parts keep their tag text even when it leaves the list. */
export async function replaceTags(tags: string[]): Promise<string[]> {
  await db.transaction(async transaction => {
    await transaction.delete(partTag);
    await transaction.insert(partTag).values(tags.map((name, position) => ({ name, position })));
  });
  return tags;
}
