import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import type { ExpenseAttachmentRepository } from '../../domain/expense-attachment.repository.js';
import { assertAttachmentsEditable } from '../../domain/expense-rules.js';
import type { ExpenseFileStorage } from '../../infrastructure/file-storage/expense-file-storage.js';
import { assertCanManageAttachments } from '../policies/expense-authorization.policy.js';
import { EXPENSE_AUDIT_ACTIONS, logExpenseAudit } from '../services/expense-audit.service.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export class RemoveExpenseAttachmentUseCase {
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
  ): Promise<void> {
    const expense = await this.expenseRepository.findById(expenseId, auth.companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(expense, actingEmployeeId);
    assertCanManageAttachments(auth, { isOwner });
    assertAttachmentsEditable(expense, auth.role, isOwner);

    const attachment = await this.attachmentRepository.findById(attachmentId, expenseId);
    if (!attachment) throw new ResourceNotFoundError('Attachment not found');

    await this.fileStorage.delete(attachment.filePath);
    await this.attachmentRepository.delete(attachmentId, expenseId);

    logExpenseAudit({
      action: EXPENSE_AUDIT_ACTIONS.ATTACHMENT_REMOVED,
      companyId: auth.companyId,
      resourceType: 'expense_attachment',
      resourceId: attachmentId,
      actorUserId: auth.userId,
      metadata: { expenseId },
    });
  }
}
