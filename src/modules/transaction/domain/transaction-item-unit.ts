export const TRANSACTION_ITEM_UNITS = ['KG', 'G', 'TON', 'LB', 'PIECE', 'BUNDLE', 'SACK'] as const;
export type TransactionItemUnit = (typeof TRANSACTION_ITEM_UNITS)[number];
