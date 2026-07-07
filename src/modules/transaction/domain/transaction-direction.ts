export const TRANSACTION_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type TransactionDirection = (typeof TRANSACTION_DIRECTIONS)[number];
