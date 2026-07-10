import type { ExpenseAttachment as PrismaExpenseAttachment } from '@prisma/client';
import { ExpenseAttachmentEntity } from '../../domain/expense-attachment.entity.js';

export function toExpenseAttachmentDomain(
  record: PrismaExpenseAttachment,
): ExpenseAttachmentEntity {
  return ExpenseAttachmentEntity.create({
    id: record.id,
    expenseId: record.expenseId,
    attachmentType: record.attachmentType,
    fileName: record.fileName,
    filePath: record.filePath,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    uploadedByUserId: record.uploadedByUserId,
    createdAt: record.createdAt,
  });
}
