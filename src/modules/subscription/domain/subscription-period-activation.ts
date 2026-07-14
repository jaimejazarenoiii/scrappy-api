import type { SubscriptionPeriodStatus } from './subscription-period-status.js';

/**
 * Returns activation timestamp when a period first becomes ACTIVE.
 */
export function activationTimestampForStatus(
  status: SubscriptionPeriodStatus,
  existingActivatedAt?: Date | null,
): Date | null {
  if (status !== 'ACTIVE') return existingActivatedAt ?? null;
  return existingActivatedAt ?? new Date();
}
