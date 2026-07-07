export const TRANSACTION_STATUSES = ['DRAFT', 'CANCELLED'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
