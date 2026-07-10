import { getLogger } from '../../../../config/logger.js';
import type { ReportFilter } from '../../domain/report-filter.js';

export function logReportAccess(
  domain: string,
  action: 'list' | 'export',
  filter: ReportFilter,
  actorUserId: string,
  extra: Record<string, unknown> = {},
): void {
  getLogger().info(
    {
      event: 'reports.access',
      domain,
      action,
      companyId: filter.companyId,
      actorUserId,
      from: filter.from?.toISOString() ?? null,
      to: filter.to?.toISOString() ?? null,
      branchId: filter.branchId ?? null,
      warehouseId: filter.warehouseId ?? null,
      vehicleId: filter.vehicleId ?? null,
      employeeId: filter.employeeId ?? null,
      tripId: filter.tripId ?? null,
      includeArchived: filter.includeArchived,
      ...extra,
    },
    'Report accessed',
  );
}
