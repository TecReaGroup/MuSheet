import { useMutation, useQuery } from '@tanstack/react-query';
import { requestJson } from '@/shared/api/http-client';
import { queryClient } from '@/shared/api/query-client';

export const partNameKey = {
  list: ['part', 'name-list'] as const,
};

export function usePartNameList() {
  return useQuery({
    queryKey: partNameKey.list,
    queryFn: () => requestJson<string[]>('GET', '/api/part-name'),
  });
}

/** Saves the whole shared list, showing it immediately and rolling back if the server refuses. */
export function useReplacePartNames() {
  return useMutation({
    mutationFn: (names: string[]) => requestJson<string[]>('PUT', '/api/part-name', { names }),
    onMutate: names => {
      const previous = queryClient.getQueryData<string[]>(partNameKey.list);
      queryClient.setQueryData(partNameKey.list, names);
      return { previous };
    },
    onError: (_error, _names, context) => queryClient.setQueryData(partNameKey.list, context?.previous),
    onSuccess: saved => queryClient.setQueryData(partNameKey.list, saved),
  });
}
