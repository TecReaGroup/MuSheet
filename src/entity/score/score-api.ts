import type { ListQuery, ScoreImportRequest, ScoreImportResponse, ScoreSummary, ScoreUpdateRequest } from '@contract/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { requestJson, toSearchParams } from '@/shared/api/http-client';
import { queryClient } from '@/shared/api/query-client';

export const scoreKey = {
  list: (query: ListQuery) => ['score', 'list', query] as const,
  lists: ['score', 'list'] as const,
  detail: (scoreId: string) => ['score', 'detail', scoreId] as const,
};

export function useScoreList(query: ListQuery) {
  return useQuery({
    queryKey: scoreKey.list(query),
    queryFn: () => requestJson<ScoreSummary[]>('GET', `/api/score?${toSearchParams({ ...query })}`),
  });
}

export function useScoreDetail(scoreId: string | undefined) {
  return useQuery({
    queryKey: scoreKey.detail(scoreId ?? ''),
    queryFn: () => requestJson<ScoreSummary>('GET', `/api/score/${scoreId}`),
    enabled: Boolean(scoreId),
  });
}

export function importScore(request: ScoreImportRequest) {
  return requestJson<ScoreImportResponse>('POST', '/api/score/import', request);
}

export function useUpdateScore(scoreId: string) {
  return useMutation({
    mutationFn: (patch: ScoreUpdateRequest) => requestJson<ScoreSummary>('PATCH', `/api/score/${scoreId}`, patch),
  });
}

export function deleteScore(scoreId: string) {
  return requestJson<void>('DELETE', `/api/score/${scoreId}`);
}

/** Records the visit for "recently opened" ordering and refreshes the lists that sort by it. */
export async function markScoreOpened(scoreId: string) {
  await requestJson<void>('POST', `/api/score/${scoreId}/open`);
  await queryClient.invalidateQueries({ queryKey: scoreKey.lists });
}

/** Copies personal scores into the team library and refreshes every list that could show them. */
export async function copyScoresToTeam(scoreIds: string[]) {
  const copies = await requestJson<ScoreSummary[]>('POST', '/api/score/team-copy', { scoreIds });
  await queryClient.invalidateQueries({ queryKey: scoreKey.lists });
  return copies;
}
