import type { ListQuery, SetlistCreateRequest, SetlistDetail, SetlistSummary, SetlistUpdateRequest } from '@contract/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { requestJson, toSearchParams } from '@/shared/api/http-client';
import { queryClient } from '@/shared/api/query-client';

export const setlistKey = {
  list: (query: ListQuery) => ['setlist', 'list', query] as const,
  lists: ['setlist', 'list'] as const,
  detail: (setlistId: string) => ['setlist', 'detail', setlistId] as const,
};

export function useSetlistList(query: ListQuery) {
  return useQuery({
    queryKey: setlistKey.list(query),
    queryFn: () => requestJson<SetlistSummary[]>('GET', `/api/setlist?${toSearchParams({ ...query })}`),
  });
}

export function useSetlistDetail(setlistId: string | undefined) {
  return useQuery({
    queryKey: setlistKey.detail(setlistId ?? ''),
    queryFn: () => requestJson<SetlistDetail>('GET', `/api/setlist/${setlistId}`),
    enabled: Boolean(setlistId),
  });
}

export function useCreateSetlist() {
  return useMutation({
    mutationFn: (request: SetlistCreateRequest) => requestJson<SetlistSummary>('POST', '/api/setlist', request),
  });
}

export function useUpdateSetlist(setlistId: string) {
  return useMutation({
    mutationFn: (patch: SetlistUpdateRequest) => requestJson<SetlistSummary>('PATCH', `/api/setlist/${setlistId}`, patch),
  });
}

export function useAppendToSetlist() {
  return useMutation({
    mutationFn: ({ setlistId, scoreId }: { setlistId: string; scoreId: string }) =>
      requestJson<void>('POST', `/api/setlist/${setlistId}/item`, { scoreId }),
  });
}

export function replaceSetlistItems(setlistId: string, scoreIds: string[]) {
  return requestJson<void>('PUT', `/api/setlist/${setlistId}/item`, { scoreIds });
}

export function deleteSetlist(setlistId: string) {
  return requestJson<void>('DELETE', `/api/setlist/${setlistId}`);
}

/** Records the visit for "recently opened" ordering and refreshes the lists that sort by it. */
export async function markSetlistOpened(setlistId: string) {
  await requestJson<void>('POST', `/api/setlist/${setlistId}/open`);
  await queryClient.invalidateQueries({ queryKey: setlistKey.lists });
}
