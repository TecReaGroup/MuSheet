import { useState } from 'react';
import { useDebouncedValue } from './use-debounced-value';

const SEARCH_DEBOUNCE_MS = 200;

/** Search box state: `query` follows every keystroke; `settledQuery` is trimmed and waits for typing to pause, so it is what drives requests. */
export function useSearchQuery() {
  const [query, setQuery] = useState('');
  const settledQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  return { query, setQuery, settledQuery };
}
