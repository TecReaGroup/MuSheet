import type { ApiErrorBody } from '@contract/api';
import { defineText, readText } from '../i18n/text';

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Keyed by the backend's `ApiErrorBody.error` code.
const ERROR_TEXT = defineText<{ byCode: Record<string, string>; fallback: string }>({
  'zh-CN': {
    byCode: {
      not_found: '内容不存在或已被删除',
      pdf_missing: 'PDF 尚未上传完成',
      hash_mismatch: '文件上传不完整，请重试',
      not_pdf: '不是有效的 PDF 文件',
      too_large: '文件太大',
      duplicate_score: '曲目单中已有这首乐曲',
      invalid_request: '提交的内容不正确',
      network: '无法连接服务器',
      unauthorized: '登录已过期，请重新登录',
      invalid_credentials: '账号或密码错误',
      account_taken: '该用户名已被使用',
      wrong_password: '当前密码不正确',
      root_immutable: 'root 账号的用户名和密码只能在 .env 中修改',
      forbidden: '没有权限执行此操作',
      not_jpeg: '图片格式不正确',
    },
    fallback: '操作失败，请稍后重试',
  },
  en: {
    byCode: {
      not_found: 'This item does not exist or has been deleted',
      pdf_missing: 'The PDF has not finished uploading',
      hash_mismatch: 'The upload was incomplete. Please try again',
      not_pdf: 'Not a valid PDF file',
      too_large: 'File is too large',
      duplicate_score: 'This score is already in the setlist',
      invalid_request: 'The submitted content is invalid',
      network: 'Unable to reach the server',
      unauthorized: 'Your session has expired. Please log in again',
      invalid_credentials: 'Incorrect account or password',
      account_taken: 'This username is already taken',
      wrong_password: 'Current password is incorrect',
      root_immutable: 'The root username and password can only be changed in .env',
      forbidden: 'You do not have permission to do this',
      not_jpeg: 'Unsupported image format',
    },
    fallback: 'Something went wrong. Please try again later',
  },
});

/** User-facing message for any thrown error, in the current locale. */
export function describeError(error: unknown): string {
  const text = readText(ERROR_TEXT);
  return (error instanceof ApiError && text.byCode[error.code]) || text.fallback;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(response.status, body.error, body.message);
  } catch {
    return new ApiError(response.status, 'http_error', response.statusText);
  }
}

async function readResponseBody<T>(response: Response): Promise<T> {
  return (response.status === 204 ? undefined : await response.json()) as T;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    throw new ApiError(0, 'network', error instanceof Error ? error.message : 'Network error');
  }
  if (!response.ok) throw await toApiError(response);
  return response;
}

export async function requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readResponseBody<T>(response);
}

export async function uploadBlob<T = void>(path: string, blob: Blob, contentType: string): Promise<T> {
  return readResponseBody<T>(await send(path, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob }));
}

/** Best-effort write that survives page unload (pending annotation saves when leaving the viewer). */
export function sendJsonOnUnload(method: string, path: string, body: unknown) {
  void fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

export function toSearchParams(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}
