import type { TransactionAttachmentProps } from '../../domain/transaction-attachment.entity.js';

export type TransactionAttachmentResponseDto = TransactionAttachmentProps;

export function buildTransactionAttachmentResponse(attachment: {
  toPrimitives(): TransactionAttachmentProps;
}): TransactionAttachmentResponseDto {
  return attachment.toPrimitives();
}
