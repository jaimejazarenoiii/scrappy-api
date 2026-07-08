import type { OrganizationMetricsProjection } from '../../domain/analytics-query.repository.js';
import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import { buildAnalyticsMeta } from './analytics-filter.response.js';

export type OrganizationAnalyticsResponseDto = OrganizationMetricsProjection &
  ReturnType<typeof buildAnalyticsMeta>;

export function buildOrganizationAnalyticsResponse(
  filter: AnalyticsFilter,
  metrics: OrganizationMetricsProjection,
): OrganizationAnalyticsResponseDto {
  return { ...metrics, ...buildAnalyticsMeta(filter) };
}
