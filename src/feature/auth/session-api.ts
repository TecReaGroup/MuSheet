import type { LoginRequest, SessionView } from '@contract/api';
import { useQuery } from '@tanstack/react-query';
import { ApiError, requestJson } from '@/shared/api/http-client';
import { queryClient, SESSION_QUERY_KEY } from '@/shared/api/query-client';
import { log } from '@/shared/lib/logger';

/** Resolves to null when logged out, so "no session" is data rather than a query error. */
async function fetchSession(): Promise<SessionView | null> {
  try {
    return await requestJson<SessionView>('GET', '/api/auth/session');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function useSession() {
  return useQuery({ queryKey: SESSION_QUERY_KEY, queryFn: fetchSession, staleTime: Infinity });
}

export async function login(request: LoginRequest) {
  const session = await requestJson<SessionView>('POST', '/api/auth/login', request);
  queryClient.setQueryData(SESSION_QUERY_KEY, session);
  log('info', 'Auth', 'Logged in');
}

/** Drops every cached query too, so the next login never sees the previous session's library. */
export async function logout() {
  await requestJson<void>('POST', '/api/auth/logout');
  queryClient.clear();
  queryClient.setQueryData(SESSION_QUERY_KEY, null);
  log('info', 'Auth', 'Logged out');
}
