import type { ExpenseMetricsProjection } from '../../domain/analytics-query.repository.js';
import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import { buildAnalyticsMeta } from './analytics-filter.response.js';

export type ExpenseAnalyticsResponseDto = ExpenseMetricsProjection &
  ReturnType<typeof buildAnalyticsMeta>;

export function buildExpenseAnalyticsResponse(
  filter: AnalyticsFilter,
  metrics: ExpenseMetricsProjection,
): ExpenseAnalyticsResponseDto {
  return { ...metrics, ...buildAnalyticsMeta(filter) };
}
