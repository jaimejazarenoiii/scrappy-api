import type { AnalyticsPeriod } from './analytics-period.js';

export interface AnalyticsFilter {
  companyId: string;
  period: AnalyticsPeriod;
  from: Date;
  to: Date;
  branchId?: string;
  warehouseId?: string;
  vehicleId?: string;
  employeeId?: string;
  includeArchived: boolean;
  rankingLimit: number;
}

export interface AnalyticsFilterQueryInput {
  period?: AnalyticsPeriod;
  from?: Date;
  to?: Date;
  branchId?: string;
  warehouseId?: string;
  vehicleId?: string;
  employeeId?: string;
  includeArchived?: boolean;
  limit?: number;
}
