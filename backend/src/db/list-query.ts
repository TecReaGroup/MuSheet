import { asc, desc, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import type { SortKey, SortOrder } from '../../../contract/api';

export function containsPattern(text: string) {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

interface SortableColumns {
  created: AnyColumn;
  title: AnyColumn;
  opened: AnyColumn;
}

/** "opened" keeps never-opened items last in both directions, then falls back to newest first. */
export function listOrdering(columns: SortableColumns, sort: SortKey, order: SortOrder): SQL[] {
  const direction = order === 'asc' ? asc : desc;
  switch (sort) {
    case 'created':
      return [direction(columns.created)];
    case 'title':
      return [direction(sql`lower(${columns.title})`), desc(columns.created)];
    case 'opened':
      return [sql`${columns.opened} ${sql.raw(order)} nulls last`, desc(columns.created)];
  }
}
