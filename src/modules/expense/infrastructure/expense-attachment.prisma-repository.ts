import { prisma } from '../../../database/prisma.client.js';
import type {
  ExpenseAttachmentRepository,
  CreateExpenseAttachmentInput,
} from '../domain/expense-attachment.repository.js';
import { toExpenseAttachmentDomain } from './mappers/expense-attachment.mapper.js';

export class ExpenseAttachmentPrismaRepository implements ExpenseAttachmentRepository {
  async create(input: CreateExpenseAttachmentInput) {
    const record = await prisma.expenseAttachment.create({
      data: {
        id: input.id,
        expenseId: input.expenseId,
        attachmentType: input.attachmentType,
        fileName: input.fileName,
        filePath: input.filePath,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        uploadedByUserId: input.uploadedByUserId,
      },
    });
    return toExpenseAttachmentDomain(record);
  }

  async findById(attachmentId: string, expenseId: string) {
    const record = await prisma.expenseAttachment.findFirst({
      where: { id: attachmentId, expenseId },
    });
    return record ? toExpenseAttachmentDomain(record) : null;
  }

  async listByExpense(expenseId: string) {
    const records = await prisma.expenseAttachment.findMany({
      where: { expenseId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toExpenseAttachmentDomain);
  }

  async countByExpense(expenseId: string): Promise<number> {
    return prisma.expenseAttachment.count({ where: { expenseId } });
  }

  async delete(attachmentId: string, expenseId: string): Promise<void> {
    await prisma.expenseAttachment.deleteMany({
      where: { id: attachmentId, expenseId },
    });
  }
}
