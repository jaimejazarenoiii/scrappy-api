export interface ApiErrorBody {
  code: string;
  message: string;
  details: Record<string, unknown>[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: Record<string, unknown>;
  error: ApiErrorBody | null;
}
