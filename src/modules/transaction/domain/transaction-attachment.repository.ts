import type { TransactionAttachmentEntity } from './transaction-attachment.entity.js';
import type { TransactionAttachmentType } from './transaction-attachment-type.js';

export interface CreateTransactionAttachmentInput {
  id: string;
  transactionId: string;
  attachmentType: TransactionAttachmentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedByUserId: string;
}

export interface TransactionAttachmentRepository {
  create(input: CreateTransactionAttachmentInput): Promise<TransactionAttachmentEntity>;
  findById(
    attachmentId: string,
    transactionId: string,
  ): Promise<TransactionAttachmentEntity | null>;
  delete(attachmentId: string, transactionId: string): Promise<void>;
  listByTransaction(transactionId: string): Promise<TransactionAttachmentEntity[]>;
  countByTransaction(transactionId: string): Promise<number>;
}
