import type { ExpenseAttachmentEntity } from '../../domain/expense-attachment.entity.js';

export interface ExpenseAttachmentResponseDto {
  id: string;
  expenseId: string;
  attachmentType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedByUserId: string;
  downloadUrl: string;
  createdAt: Date;
}

export function buildExpenseAttachmentDownloadUrl(
  expenseId: string,
  attachmentId: string,
  accessToken?: string,
): string {
  const base = `/api/v1/expenses/${expenseId}/attachments/${attachmentId}/content`;
  if (!accessToken) return base;
  return `${base}?access_token=${encodeURIComponent(accessToken)}`;
}

export function buildExpenseAttachmentResponse(
  attachment: ExpenseAttachmentEntity,
): ExpenseAttachmentResponseDto {
  const props = attachment.toPrimitives();
  return {
    id: props.id,
    expenseId: props.expenseId,
    attachmentType: props.attachmentType,
    fileName: props.fileName,
    mimeType: props.mimeType,
    fileSize: props.fileSize,
    uploadedByUserId: props.uploadedByUserId,
    downloadUrl: buildExpenseAttachmentDownloadUrl(props.expenseId, props.id),
    createdAt: props.createdAt,
  };
}
