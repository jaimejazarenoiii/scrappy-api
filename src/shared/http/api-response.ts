import type { ApiErrorBody, ApiResponse } from './api-response.types.js';

export function success<T>(data: T, meta: Record<string, unknown> = {}): ApiResponse<T> {
  return { success: true, data, meta, error: null };
}

export function failure(
  error: ApiErrorBody,
  meta: Record<string, unknown> = {},
): ApiResponse<null> {
  return { success: false, data: null, meta, error };
}
