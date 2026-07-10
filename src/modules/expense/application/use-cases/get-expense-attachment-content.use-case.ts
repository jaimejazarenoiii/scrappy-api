import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import type { ExpenseAttachmentRepository } from '../../domain/expense-attachment.repository.js';
import type { ExpenseFileStorage } from '../../infrastructure/file-storage/expense-file-storage.js';
import { assertCanViewExpense } from '../policies/expense-authorization.policy.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export interface ExpenseAttachmentContentResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

export class GetExpenseAttachmentContentUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly attachmentRepository: ExpenseAttachmentRepository,
    private readonly fileStorage: ExpenseFileStorage,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    expenseId: string,
    attachmentId: string,
    auth: AuthorizationContext,
  ): Promise<ExpenseAttachmentContentResult> {
    const expense = await this.expenseRepository.findById(expenseId, auth.companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(expense, actingEmployeeId);
    assertCanViewExpense(auth, { isOwner });

    const attachment = await this.attachmentRepository.findById(attachmentId, expenseId);
    if (!attachment) throw new ResourceNotFoundError('Attachment not found');

    const props = attachment.toPrimitives();
    const buffer = await this.fileStorage.read(props.filePath);
    return {
      buffer,
      mimeType: props.mimeType,
      fileName: props.fileName,
    };
  }
}
