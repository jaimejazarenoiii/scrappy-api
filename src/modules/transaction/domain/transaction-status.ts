export const TRANSACTION_STATUSES = ['DRAFT', 'READY_FOR_PAYMENT', 'PAID', 'CANCELLED'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
