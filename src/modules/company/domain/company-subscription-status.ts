export const COMPANY_SUBSCRIPTION_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'GRACE_PERIOD',
  'EXPIRED',
  'SUSPENDED',
] as const;

export type CompanySubscriptionStatus = (typeof COMPANY_SUBSCRIPTION_STATUSES)[number];

export const ALLOWED_LOGIN_SUBSCRIPTION_STATUSES: readonly CompanySubscriptionStatus[] = [
  'TRIAL',
  'ACTIVE',
  'GRACE_PERIOD',
];

export function isAllowedSubscriptionStatus(status: CompanySubscriptionStatus): boolean {
  return (ALLOWED_LOGIN_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

export function isBlockedSubscriptionStatus(status: CompanySubscriptionStatus): boolean {
  return status === 'EXPIRED' || status === 'SUSPENDED';
}
