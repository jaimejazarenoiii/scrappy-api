export const TRANSACTION_LOCATION_TYPES = ['BRANCH', 'WAREHOUSE', 'OUTSIDE'] as const;
export type TransactionLocationType = (typeof TRANSACTION_LOCATION_TYPES)[number];
