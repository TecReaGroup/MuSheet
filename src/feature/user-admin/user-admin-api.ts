import type { ManagedUserView, UserCreateRequest } from '@contract/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { requestJson } from '@/shared/api/http-client';
import { queryClient } from '@/shared/api/query-client';

const USER_LIST_KEY = ['user', 'list'] as const;

export function useUserList() {
  return useQuery({ queryKey: USER_LIST_KEY, queryFn: () => requestJson<ManagedUserView[]>('GET', '/api/user') });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (request: UserCreateRequest) => requestJson<ManagedUserView>('POST', '/api/user', request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_LIST_KEY }),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      requestJson<void>('PUT', `/api/user/${userId}/password`, { password }),
  });
}

export function deleteUser(userId: string) {
  return requestJson<void>('DELETE', `/api/user/${userId}`);
}

export function hideUserFromList(userId: string) {
  queryClient.setQueryData<ManagedUserView[]>(USER_LIST_KEY, users => users?.filter(user => user.id !== userId));
}

export function refreshUserList() {
  return queryClient.invalidateQueries({ queryKey: USER_LIST_KEY });
}
