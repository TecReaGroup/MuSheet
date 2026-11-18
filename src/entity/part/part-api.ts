import type { PartCreateRequest, ScoreSummary, ViewerPart } from '@contract/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { requestJson } from '@/shared/api/http-client';

export const partKey = {
  viewer: (partId: string) => ['part', 'viewer', partId] as const,
};

export function useViewerPart(partId: string | undefined) {
  return useQuery({
    queryKey: partKey.viewer(partId ?? ''),
    queryFn: () => requestJson<ViewerPart>('GET', `/api/part/${partId}`),
    enabled: Boolean(partId),
  });
}

export function deletePart(partId: string) {
  return requestJson<void>('DELETE', `/api/part/${partId}`);
}

export function useAddPart(scoreId: string) {
  return useMutation({
    mutationFn: (request: PartCreateRequest) =>
      requestJson<{ partId: string; score: ScoreSummary }>('POST', `/api/score/${scoreId}/part`, request),
  });
}

export function useReorderParts(scoreId: string) {
  return useMutation({
    mutationFn: (partIds: string[]) => requestJson<void>('PUT', `/api/score/${scoreId}/part-order`, { partIds }),
  });
}
