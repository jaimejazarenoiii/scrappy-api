import type { TransactionItemProps } from '../../domain/transaction-item.entity.js';

export type TransactionItemResponseDto = TransactionItemProps;

export function buildTransactionItemResponse(item: {
  toPrimitives(): TransactionItemProps;
}): TransactionItemResponseDto {
  return item.toPrimitives();
}
