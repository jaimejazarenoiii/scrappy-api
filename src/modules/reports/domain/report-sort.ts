export type SortOrder = 'asc' | 'desc';

export interface ReportSort<T extends string = string> {
  sortBy: T;
  sortOrder: SortOrder;
}

export function resolveReportSort<T extends string>(
  sortBy: T | undefined,
  sortOrder: SortOrder | undefined,
  defaultSortBy: T,
  defaultSortOrder: SortOrder,
): ReportSort<T> {
  return {
    sortBy: sortBy ?? defaultSortBy,
    sortOrder: sortOrder ?? defaultSortOrder,
  };
}
