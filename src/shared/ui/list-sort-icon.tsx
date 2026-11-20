import { createLucideIcon } from 'lucide-react';

// NOTE: Ship in lucide 1.x as `ListSortAscending` / `ListSortDescending`; delete this once lucide-react is upgraded past 0.x.
export const ListSortAscendingIcon = createLucideIcon('list-sort-ascending', [
  ['path', { d: 'M3 19h18', key: 'sort-bottom' }],
  ['path', { d: 'M15 12H3', key: 'sort-mid' }],
  ['path', { d: 'M9 5H3', key: 'sort-top' }],
]);

export const ListSortDescendingIcon = createLucideIcon('list-sort-descending', [
  ['path', { d: 'M15 12H3', key: 'sort-mid' }],
  ['path', { d: 'M3 5h18', key: 'sort-top' }],
  ['path', { d: 'M9 19H3', key: 'sort-bottom' }],
]);
