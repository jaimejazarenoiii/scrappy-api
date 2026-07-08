import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanAccessAnalytics } from '../../domain/analytics-authorization.policy.js';
import type { AnalyticsQueryRepository } from '../../domain/analytics-query.repository.js';
import { logAnalyticsAccess } from '../services/analytics-audit.service.js';
import type {
  AnalyticsFilterPipeline,
  ResolvedAnalyticsQuery,
} from '../services/analytics-filter-pipeline.js';
import {
  buildCompanyAnalyticsResponse,
  type CompanyAnalyticsResponseDto,
} from '../dto/company-analytics.response.js';

export class GetCompanyAnalyticsUseCase {
  constructor(
    private readonly queryRepository: AnalyticsQueryRepository,
    private readonly filterPipeline: AnalyticsFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedAnalyticsQuery,
  ): Promise<CompanyAnalyticsResponseDto> {
    assertCanAccessAnalytics(auth.role);
    const filter = await this.filterPipeline.build(auth.companyId, query);
    logAnalyticsAccess('company', filter, auth.userId);
    const metrics = await this.queryRepository.getCompanyMetrics(filter);
    return buildCompanyAnalyticsResponse(filter, metrics);
  }
}
