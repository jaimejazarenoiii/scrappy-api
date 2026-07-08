import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import type { AnalyticsPeriod } from '../../domain/analytics-period.js';
import { clampRankingLimit } from '../../../../shared/analytics/analytics-ranking.js';
import type { AnalyticsPeriodResolverService } from '../services/analytics-period-resolver.service.js';
import type { AnalyticsFilterValidatorService } from '../services/analytics-filter-validator.service.js';

export interface ResolvedAnalyticsQuery {
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

export class AnalyticsFilterPipeline {
  constructor(
    private readonly periodResolver: AnalyticsPeriodResolverService,
    private readonly filterValidator: AnalyticsFilterValidatorService,
  ) {}

  async build(companyId: string, query: ResolvedAnalyticsQuery): Promise<AnalyticsFilter> {
    const period = query.period ?? 'THIS_MONTH';
    const bounds = this.periodResolver.resolve(period, query.from, query.to);
    const filter: AnalyticsFilter = {
      companyId,
      period,
      from: bounds.from,
      to: bounds.to,
      branchId: query.branchId,
      warehouseId: query.warehouseId,
      vehicleId: query.vehicleId,
      employeeId: query.employeeId,
      includeArchived: query.includeArchived ?? false,
      rankingLimit: clampRankingLimit(query.limit),
    };
    await this.filterValidator.validateReferences(filter);
    return filter;
  }
}
