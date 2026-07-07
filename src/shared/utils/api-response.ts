import type { ApiErrorBody, ApiResponse } from '../types/api-response.type.js';

/**
 * Builds a successful API response envelope.
 * @param data - Response payload
 * @param meta - Optional metadata
 * @returns Standard success envelope
 */
export function success<T>(data: T, meta: Record<string, unknown> = {}): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
    error: null,
  };
}

/**
 * Builds a failed API response envelope.
 * @param error - Client-safe error details
 * @param meta - Optional metadata
 * @returns Standard error envelope
 */
export function failure(
  error: ApiErrorBody,
  meta: Record<string, unknown> = {},
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    meta,
    error,
  };
}
