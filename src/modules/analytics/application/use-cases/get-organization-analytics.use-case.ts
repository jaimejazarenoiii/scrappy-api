import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanAccessAnalytics } from '../../domain/analytics-authorization.policy.js';
import type { AnalyticsQueryRepository } from '../../domain/analytics-query.repository.js';
import { logAnalyticsAccess } from '../services/analytics-audit.service.js';
import type {
  AnalyticsFilterPipeline,
  ResolvedAnalyticsQuery,
} from '../services/analytics-filter-pipeline.js';
import {
  buildOrganizationAnalyticsResponse,
  type OrganizationAnalyticsResponseDto,
} from '../dto/organization-analytics.response.js';

export class GetOrganizationAnalyticsUseCase {
  constructor(
    private readonly queryRepository: AnalyticsQueryRepository,
    private readonly filterPipeline: AnalyticsFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedAnalyticsQuery,
  ): Promise<OrganizationAnalyticsResponseDto> {
    assertCanAccessAnalytics(auth.role);
    const filter = await this.filterPipeline.build(auth.companyId, query);
    logAnalyticsAccess('organization', filter, auth.userId);
    const metrics = await this.queryRepository.getOrganizationMetrics(filter);
    return buildOrganizationAnalyticsResponse(filter, metrics);
  }
}
