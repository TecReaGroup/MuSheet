import type { ApiErrorBody } from '@contract/api';

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  instrument_exists: '这首乐曲已经有该声部了',
  not_found: '内容不存在或已被删除',
  pdf_missing: 'PDF 尚未上传完成',
  hash_mismatch: '文件上传不完整，请重试',
  not_pdf: '不是有效的 PDF 文件',
  too_large: '文件太大',
  duplicate_score: '曲目单中已有这首乐曲',
  invalid_request: '提交的内容不正确',
  network: '无法连接服务器',
};

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return ERROR_MESSAGES[error.code] ?? '操作失败，请稍后重试';
  return '操作失败，请稍后重试';
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(response.status, body.error, body.message);
  } catch {
    return new ApiError(response.status, 'http_error', response.statusText);
  }
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
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export async function uploadBlob(path: string, blob: Blob, contentType: string): Promise<void> {
  await send(path, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
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
