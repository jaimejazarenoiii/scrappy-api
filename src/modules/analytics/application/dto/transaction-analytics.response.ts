import type { TransactionMetricsProjection } from '../../domain/analytics-query.repository.js';
import type { AnalyticsFilter } from '../../domain/analytics-filter.js';
import { buildAnalyticsMeta } from './analytics-filter.response.js';

export type TransactionAnalyticsResponseDto = TransactionMetricsProjection &
  ReturnType<typeof buildAnalyticsMeta>;

export function buildTransactionAnalyticsResponse(
  filter: AnalyticsFilter,
  metrics: TransactionMetricsProjection,
): TransactionAnalyticsResponseDto {
  return { ...metrics, ...buildAnalyticsMeta(filter) };
}
