import type { WorkforceMetricsProjection } from '../../domain/analytics-query.repository.js';
import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import { buildAnalyticsMeta } from './analytics-filter.response.js';

export type WorkforceAnalyticsResponseDto = WorkforceMetricsProjection &
  ReturnType<typeof buildAnalyticsMeta>;

export function buildWorkforceAnalyticsResponse(
  filter: AnalyticsFilter,
  metrics: WorkforceMetricsProjection,
): WorkforceAnalyticsResponseDto {
  return { ...metrics, ...buildAnalyticsMeta(filter) };
}
