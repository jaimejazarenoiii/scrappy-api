import type { ReportFilter } from '../../domain/report-filter.js';
import type { ReportPagination } from '../../domain/report-pagination.js';
import type { ReportSort } from '../../domain/report-sort.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';

export interface AppliedReportCriteriaDto {
  from: Date | null;
  to: Date | null;
  branchId: string | null;
  warehouseId: string | null;
  vehicleId: string | null;
  employeeId: string | null;
  tripId: string | null;
  transactionNumber: string | null;
  direction: string | null;
  status: string | null;
  category: string | null;
  referenceType: string | null;
  search: string | null;
  sortBy: string;
  sortOrder: string;
  includeArchived: boolean;
}

export function buildAppliedReportCriteria(
  filter: ReportFilter,
  sort: ReportSort,
  search?: string,
): AppliedReportCriteriaDto {
  return {
    from: filter.from ?? null,
    to: filter.to ?? null,
    branchId: filter.branchId ?? null,
    warehouseId: filter.warehouseId ?? null,
    vehicleId: filter.vehicleId ?? null,
    employeeId: filter.employeeId ?? null,
    tripId: filter.tripId ?? null,
    transactionNumber: filter.transactionNumber ?? null,
    direction: filter.direction ?? null,
    status: filter.status ?? null,
    category: filter.category ?? null,
    referenceType: filter.referenceType ?? null,
    search: search ?? null,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    includeArchived: filter.includeArchived,
  };
}

export interface ReportListResponseDto<TRow> {
  items: TRow[];
  appliedCriteria: AppliedReportCriteriaDto;
  generatedAt: Date;
  meta: PaginationMeta;
}

export function buildReportListResponse<TRow>(
  filter: ReportFilter,
  sort: ReportSort,
  pagination: ReportPagination,
  search: string | undefined,
  items: TRow[],
  total: number,
): ReportListResponseDto<TRow> {
  return {
    items,
    appliedCriteria: buildAppliedReportCriteria(filter, sort, search),
    generatedAt: new Date(),
    meta: buildPaginationMeta(pagination.page, pagination.limit, total),
  };
}
