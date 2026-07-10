import { ValidationAppError } from '../../../../shared/errors/http-exceptions.js';
import { normalizeReportSearch } from '../../../../shared/reporting/report-search.js';
import type { ReportFilter } from '../../domain/report-filter.js';
import { clampReportPagination, type ReportPagination } from '../../domain/report-pagination.js';
import { resolveReportSort, type ReportSort, type SortOrder } from '../../domain/report-sort.js';
import type { ReportFilterValidatorService } from './report-filter-validator.service.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MAX_REPORT_RANGE_DAYS = 366;

export interface ResolvedReportQuery extends Record<string, unknown> {
  from?: Date;
  to?: Date;
  branchId?: string;
  warehouseId?: string;
  vehicleId?: string;
  employeeId?: string;
  tripId?: string;
  transactionNumber?: string;
  direction?: ReportFilter['direction'];
  status?: string;
  category?: string;
  referenceType?: string;
  includeArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface DateRangePolicy {
  required: boolean;
}

export interface ResolvedReportContext<TSort extends string = string> {
  filter: ReportFilter;
  pagination: ReportPagination;
  sort: ReportSort<TSort>;
  search?: string;
}

export class ReportFilterPipeline {
  constructor(private readonly filterValidator: ReportFilterValidatorService) {}

  async build<TSort extends string>(
    companyId: string,
    query: ResolvedReportQuery,
    datePolicy: DateRangePolicy,
    defaultSortBy: TSort,
    defaultSortOrder: SortOrder,
  ): Promise<ResolvedReportContext<TSort>> {
    this.validateDateRange(query.from, query.to, datePolicy.required);

    const filter: ReportFilter = {
      companyId,
      from: query.from,
      to: query.to,
      branchId: query.branchId,
      warehouseId: query.warehouseId,
      vehicleId: query.vehicleId,
      employeeId: query.employeeId,
      tripId: query.tripId,
      transactionNumber: query.transactionNumber,
      direction: query.direction,
      status: query.status,
      category: query.category,
      referenceType: query.referenceType,
      includeArchived: query.includeArchived ?? false,
    };

    await this.filterValidator.validateReferences(filter);

    const pagination = clampReportPagination(
      query.page as number | undefined,
      query.limit as number | undefined,
    );
    const sort = resolveReportSort(
      query.sortBy as TSort | undefined,
      query.sortOrder,
      defaultSortBy,
      defaultSortOrder,
    );
    const search = normalizeReportSearch(query.search as string | undefined);

    return { filter, pagination, sort, search };
  }

  private validateDateRange(from: Date | undefined, to: Date | undefined, required: boolean): void {
    if (required) {
      if (!from || !to) {
        throw new ValidationAppError('from and to are required for this report');
      }
    } else if ((from && !to) || (!from && to)) {
      throw new ValidationAppError('from and to must both be provided when using a date range');
    }

    if (from && to) {
      if (to < from) {
        throw new ValidationAppError('to must be greater than or equal to from');
      }
      const spanDays = (to.getTime() - from.getTime()) / MS_PER_DAY;
      if (spanDays > MAX_REPORT_RANGE_DAYS) {
        throw new ValidationAppError(`Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days`);
      }
    }
  }
}
