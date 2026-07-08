import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanAccessAnalytics } from '../../domain/analytics-authorization.policy.js';
import type { AnalyticsQueryRepository } from '../../domain/analytics-query.repository.js';
import { logAnalyticsAccess } from '../services/analytics-audit.service.js';
import type {
  AnalyticsFilterPipeline,
  ResolvedAnalyticsQuery,
} from '../services/analytics-filter-pipeline.js';
import {
  buildExpenseAnalyticsResponse,
  type ExpenseAnalyticsResponseDto,
} from '../dto/expense-analytics.response.js';

export class GetExpenseAnalyticsUseCase {
  constructor(
    private readonly queryRepository: AnalyticsQueryRepository,
    private readonly filterPipeline: AnalyticsFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedAnalyticsQuery,
  ): Promise<ExpenseAnalyticsResponseDto> {
    assertCanAccessAnalytics(auth.role);
    const filter = await this.filterPipeline.build(auth.companyId, query);
    logAnalyticsAccess('expenses', filter, auth.userId);
    const metrics = await this.queryRepository.getExpenseMetrics(filter);
    return buildExpenseAnalyticsResponse(filter, metrics);
  }
}
