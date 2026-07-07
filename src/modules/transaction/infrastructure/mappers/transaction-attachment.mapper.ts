import type { TransactionAttachment as PrismaTransactionAttachment } from '@prisma/client';
import { TransactionAttachmentEntity } from '../../domain/transaction-attachment.entity.js';

export function toTransactionAttachmentDomain(
  record: PrismaTransactionAttachment,
): TransactionAttachmentEntity {
  return TransactionAttachmentEntity.create({
    id: record.id,
    transactionId: record.transactionId,
    attachmentType: record.attachmentType,
    fileName: record.fileName,
    filePath: record.filePath,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    uploadedByUserId: record.uploadedByUserId,
    createdAt: record.createdAt,
  });
}
