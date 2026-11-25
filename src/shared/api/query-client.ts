import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { log, serializeError } from '../lib/logger';
import { ApiError, describeError } from './http-client';

const STALE_TIME_MS = 30_000;

// Every entity's query keys start with one of these roots; any library mutation can
// affect the others (e.g. deleting a score changes setlist counts), so they refresh together.
export const LIBRARY_QUERY_ROOTS = ['score', 'setlist', 'part'] as const;
export const SESSION_QUERY_KEY = ['session'] as const;

// Any 401 means the cookie expired or was revoked; clearing the session lets the route guard send the user to login.
function dropSessionWhenUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401) queryClient.setQueryData(SESSION_QUERY_KEY, null);
}

function logFailure(kind: string, error: unknown) {
  const isExpected = error instanceof ApiError && error.status > 0 && error.status < 500;
  log(isExpected ? 'warn' : 'error', 'API', `${kind} failed`, serializeError(error));
}

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: (failureCount, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: error => {
      logFailure('Query', error);
      dropSessionWhenUnauthorized(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: error => {
      logFailure('Mutation', error);
      dropSessionWhenUnauthorized(error);
      toast.error(describeError(error));
    },
    onSettled: () => invalidateLibrary(),
  }),
});

export function invalidateLibrary() {
  return Promise.all(LIBRARY_QUERY_ROOTS.map(root => queryClient.invalidateQueries({ queryKey: [root] })));
}
