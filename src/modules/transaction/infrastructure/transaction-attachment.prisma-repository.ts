import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  CreateTransactionAttachmentInput,
  TransactionAttachmentRepository,
} from '../domain/transaction-attachment.repository.js';
import { toTransactionAttachmentDomain } from './mappers/transaction-attachment.mapper.js';

export class TransactionAttachmentPrismaRepository implements TransactionAttachmentRepository {
  async create(input: CreateTransactionAttachmentInput) {
    const record = await prisma.transactionAttachment.create({
      data: {
        id: input.id,
        transactionId: input.transactionId,
        attachmentType: input.attachmentType,
        fileName: input.fileName,
        filePath: input.filePath,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        uploadedByUserId: input.uploadedByUserId,
      },
    });
    return toTransactionAttachmentDomain(record);
  }

  async findById(attachmentId: string, transactionId: string) {
    const record = await prisma.transactionAttachment.findFirst({
      where: { id: attachmentId, transactionId },
    });
    return record ? toTransactionAttachmentDomain(record) : null;
  }

  async delete(attachmentId: string, transactionId: string) {
    const existing = await this.findById(attachmentId, transactionId);
    if (!existing) throw new ResourceNotFoundError('Transaction attachment not found');
    await prisma.transactionAttachment.delete({ where: { id: attachmentId } });
  }

  async listByTransaction(transactionId: string) {
    const records = await prisma.transactionAttachment.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toTransactionAttachmentDomain);
  }

  async countByTransaction(transactionId: string) {
    return prisma.transactionAttachment.count({ where: { transactionId } });
  }
}
