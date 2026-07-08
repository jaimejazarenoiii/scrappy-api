import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import type { AnalyticsPeriod } from '../../domain/analytics-period.js';

export interface AppliedAnalyticsFiltersDto {
  period: AnalyticsPeriod;
  from: Date;
  to: Date;
  branchId: string | null;
  warehouseId: string | null;
  vehicleId: string | null;
  employeeId: string | null;
  includeArchived: boolean;
}

export function buildAppliedAnalyticsFilters(filter: AnalyticsFilter): AppliedAnalyticsFiltersDto {
  return {
    period: filter.period,
    from: filter.from,
    to: filter.to,
    branchId: filter.branchId ?? null,
    warehouseId: filter.warehouseId ?? null,
    vehicleId: filter.vehicleId ?? null,
    employeeId: filter.employeeId ?? null,
    includeArchived: filter.includeArchived,
  };
}

export interface AnalyticsMetaDto {
  appliedFilters: AppliedAnalyticsFiltersDto;
  generatedAt: Date;
}

export function buildAnalyticsMeta(filter: AnalyticsFilter): AnalyticsMetaDto {
  return {
    appliedFilters: buildAppliedAnalyticsFilters(filter),
    generatedAt: new Date(),
  };
}
