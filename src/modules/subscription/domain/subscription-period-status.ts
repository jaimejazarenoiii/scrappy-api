export const SUBSCRIPTION_PERIOD_STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

export type SubscriptionPeriodStatus = (typeof SUBSCRIPTION_PERIOD_STATUSES)[number];

export const CLOSED_SUBSCRIPTION_PERIOD_STATUSES: readonly SubscriptionPeriodStatus[] = [
  'EXPIRED',
  'CANCELLED',
];

export function isClosedPeriodStatus(status: SubscriptionPeriodStatus): boolean {
  return (CLOSED_SUBSCRIPTION_PERIOD_STATUSES as readonly string[]).includes(status);
}
