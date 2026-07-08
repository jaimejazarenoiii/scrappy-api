import type { TransactionAttachmentProps } from '../../domain/transaction-attachment.entity.js';

export interface TransactionAttachmentResponseDto extends TransactionAttachmentProps {
  downloadUrl: string;
}

export function buildTransactionAttachmentDownloadUrl(
  transactionId: string,
  attachmentId: string,
  accessToken?: string,
): string {
  const base = `/api/v1/transactions/${transactionId}/attachments/${attachmentId}/content`;
  if (!accessToken) return base;
  return `${base}?access_token=${encodeURIComponent(accessToken)}`;
}

export function buildTransactionAttachmentResponse(attachment: {
  toPrimitives(): TransactionAttachmentProps;
}): TransactionAttachmentResponseDto {
  const props = attachment.toPrimitives();
  return {
    ...props,
    downloadUrl: buildTransactionAttachmentDownloadUrl(props.transactionId, props.id),
  };
}
