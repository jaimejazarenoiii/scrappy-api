import type { ExpenseAttachmentEntity } from './expense-attachment.entity.js';
import type { ExpenseAttachmentType } from './expense-attachment-type.js';

export interface CreateExpenseAttachmentInput {
  id: string;
  expenseId: string;
  attachmentType: ExpenseAttachmentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedByUserId: string;
}

export interface ExpenseAttachmentRepository {
  create(input: CreateExpenseAttachmentInput): Promise<ExpenseAttachmentEntity>;
  findById(attachmentId: string, expenseId: string): Promise<ExpenseAttachmentEntity | null>;
  listByExpense(expenseId: string): Promise<ExpenseAttachmentEntity[]>;
  countByExpense(expenseId: string): Promise<number>;
  delete(attachmentId: string, expenseId: string): Promise<void>;
}
