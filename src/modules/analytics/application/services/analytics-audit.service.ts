import { getLogger } from '../../../../config/logger.js';
import type { AnalyticsFilter } from '../../domain/analytics-filter.js';

export function logAnalyticsAccess(
  dashboard: string,
  filter: AnalyticsFilter,
  actorUserId: string,
): void {
  getLogger().info(
    {
      event: 'analytics.access',
      dashboard,
      companyId: filter.companyId,
      actorUserId,
      period: filter.period,
      from: filter.from.toISOString(),
      to: filter.to.toISOString(),
      branchId: filter.branchId ?? null,
      warehouseId: filter.warehouseId ?? null,
      vehicleId: filter.vehicleId ?? null,
      employeeId: filter.employeeId ?? null,
      includeArchived: filter.includeArchived,
    },
    'Analytics dashboard accessed',
  );
}
