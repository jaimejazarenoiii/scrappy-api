import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanAccessAnalytics } from '../../domain/analytics-authorization.policy.js';
import type { AnalyticsQueryRepository } from '../../domain/analytics-query.repository.js';
import { logAnalyticsAccess } from '../services/analytics-audit.service.js';
import type {
  AnalyticsFilterPipeline,
  ResolvedAnalyticsQuery,
} from '../services/analytics-filter-pipeline.js';
import {
  buildWorkforceAnalyticsResponse,
  type WorkforceAnalyticsResponseDto,
} from '../dto/workforce-analytics.response.js';

export class GetWorkforceAnalyticsUseCase {
  constructor(
    private readonly queryRepository: AnalyticsQueryRepository,
    private readonly filterPipeline: AnalyticsFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedAnalyticsQuery,
  ): Promise<WorkforceAnalyticsResponseDto> {
    assertCanAccessAnalytics(auth.role);
    const filter = await this.filterPipeline.build(auth.companyId, query);
    logAnalyticsAccess('workforce', filter, auth.userId);
    const metrics = await this.queryRepository.getWorkforceMetrics(filter);
    return buildWorkforceAnalyticsResponse(filter, metrics);
  }
}
