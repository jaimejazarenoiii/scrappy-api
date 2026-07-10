import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import type { ExpenseAttachmentRepository } from '../../domain/expense-attachment.repository.js';
import {
  buildExpenseAttachmentResponse,
  type ExpenseAttachmentResponseDto,
} from '../dto/expense-attachment.response.js';
import { assertCanViewExpense } from '../policies/expense-authorization.policy.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export class ListExpenseAttachmentsUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly attachmentRepository: ExpenseAttachmentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    expenseId: string,
    auth: AuthorizationContext,
  ): Promise<ExpenseAttachmentResponseDto[]> {
    const expense = await this.expenseRepository.findById(expenseId, auth.companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(expense, actingEmployeeId);
    assertCanViewExpense(auth, { isOwner });

    const attachments = await this.attachmentRepository.listByExpense(expenseId);
    return attachments.map(buildExpenseAttachmentResponse);
  }
}
