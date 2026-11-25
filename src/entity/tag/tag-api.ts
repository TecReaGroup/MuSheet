import { useMutation, useQuery } from '@tanstack/react-query';
import { requestJson } from '@/shared/api/http-client';
import { queryClient } from '@/shared/api/query-client';

export const tagKey = {
  list: ['tag', 'list'] as const,
};

export function useTagList() {
  return useQuery({
    queryKey: tagKey.list,
    queryFn: () => requestJson<string[]>('GET', '/api/tag'),
  });
}

/** Saves the whole shared list, showing it immediately and rolling back if the server refuses. */
export function useReplaceTags() {
  return useMutation({
    mutationFn: (tags: string[]) => requestJson<string[]>('PUT', '/api/tag', { tags }),
    onMutate: tags => {
      const previous = queryClient.getQueryData<string[]>(tagKey.list);
      queryClient.setQueryData(tagKey.list, tags);
      return { previous };
    },
    onError: (_error, _tags, context) => queryClient.setQueryData(tagKey.list, context?.previous),
    onSuccess: saved => queryClient.setQueryData(tagKey.list, saved),
  });
}
