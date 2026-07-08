import type { CompanyMetricsProjection } from '../../domain/analytics-query.repository.js';
import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import { buildAnalyticsMeta } from './analytics-filter.response.js';

export interface CompanyAnalyticsResponseDto extends CompanyMetricsProjection {
  appliedFilters: ReturnType<typeof buildAnalyticsMeta>['appliedFilters'];
  generatedAt: Date;
}

export function buildCompanyAnalyticsResponse(
  filter: AnalyticsFilter,
  metrics: CompanyMetricsProjection,
): CompanyAnalyticsResponseDto {
  const meta = buildAnalyticsMeta(filter);
  return {
    ...metrics,
    ...meta,
  };
}
