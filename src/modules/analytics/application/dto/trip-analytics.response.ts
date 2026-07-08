import type { TripMetricsProjection } from '../../domain/analytics-query.repository.js';
import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import { buildAnalyticsMeta } from './analytics-filter.response.js';

export type TripAnalyticsResponseDto = TripMetricsProjection &
  ReturnType<typeof buildAnalyticsMeta>;

export function buildTripAnalyticsResponse(
  filter: AnalyticsFilter,
  metrics: TripMetricsProjection,
): TripAnalyticsResponseDto {
  return { ...metrics, ...buildAnalyticsMeta(filter) };
}
