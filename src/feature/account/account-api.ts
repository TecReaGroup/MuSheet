import type { AccountRenameRequest, AvatarPreset, PasswordChangeRequest, SessionView } from '@contract/api';
import { useMutation } from '@tanstack/react-query';
import { requestJson, uploadBlob } from '@/shared/api/http-client';
import { queryClient, SESSION_QUERY_KEY } from '@/shared/api/query-client';

/** Every account endpoint answers with the updated session, so the sidebar and settings refresh in place. */
function storeSession(session: SessionView) {
  queryClient.setQueryData(SESSION_QUERY_KEY, session);
}

export function useRenameAccount() {
  return useMutation({
    mutationFn: (request: AccountRenameRequest) => requestJson<SessionView>('PUT', '/api/account/name', request),
    onSuccess: storeSession,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (request: PasswordChangeRequest) => requestJson<void>('PUT', '/api/account/password', request),
  });
}

export function useChoosePresetAvatar() {
  return useMutation({
    mutationFn: (preset: AvatarPreset) => requestJson<SessionView>('PUT', '/api/account/avatar/preset', { preset }),
    onSuccess: storeSession,
  });
}

export function useUploadAvatarImage() {
  return useMutation({
    mutationFn: (image: Blob) => uploadBlob<SessionView>('/api/account/avatar/image', image, 'image/jpeg'),
    onSuccess: storeSession,
  });
}

export function useResetAvatar() {
  return useMutation({
    mutationFn: () => requestJson<SessionView>('DELETE', '/api/account/avatar'),
    onSuccess: storeSession,
  });
}
