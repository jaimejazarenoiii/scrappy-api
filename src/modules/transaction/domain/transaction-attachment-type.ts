export const TRANSACTION_ATTACHMENT_TYPES = ['PHOTO'] as const;
export type TransactionAttachmentType = (typeof TRANSACTION_ATTACHMENT_TYPES)[number];
