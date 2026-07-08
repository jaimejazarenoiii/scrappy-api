export const ANALYTICS_PERIODS = [
  'TODAY',
  'YESTERDAY',
  'THIS_WEEK',
  'THIS_MONTH',
  'THIS_YEAR',
  'CUSTOM',
] as const;

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface AnalyticsPeriodBounds {
  from: Date;
  to: Date;
}
