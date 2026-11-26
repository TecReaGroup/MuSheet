import type { LibraryStatView } from '@contract/api';
import { useQuery } from '@tanstack/react-query';
import { requestJson } from '@/shared/api/http-client';

export function useLibraryStat() {
  return useQuery({ queryKey: ['library-stat'], queryFn: () => requestJson<LibraryStatView>('GET', '/api/library-stat') });
}
