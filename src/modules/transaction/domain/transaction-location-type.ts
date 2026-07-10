export const TRANSACTION_LOCATION_TYPES = ['BRANCH', 'WAREHOUSE', 'OUTSIDE', 'TRIP'] as const;
export type TransactionLocationType = (typeof TRANSACTION_LOCATION_TYPES)[number];
