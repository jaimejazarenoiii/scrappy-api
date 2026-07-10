export const REPORT_DEFAULT_PAGE = 1;
export const REPORT_DEFAULT_LIMIT = 20;
export const REPORT_MAX_LIMIT = 100;

export interface ReportPagination {
  page: number;
  limit: number;
}

export function clampReportPagination(
  page: number | undefined,
  limit: number | undefined,
): ReportPagination {
  const resolvedPage = page !== undefined && page >= 1 ? page : REPORT_DEFAULT_PAGE;
  const resolvedLimit =
    limit !== undefined ? Math.min(Math.max(limit, 1), REPORT_MAX_LIMIT) : REPORT_DEFAULT_LIMIT;
  return { page: resolvedPage, limit: resolvedLimit };
}

export function reportSkip(pagination: ReportPagination): number {
  return (pagination.page - 1) * pagination.limit;
}
