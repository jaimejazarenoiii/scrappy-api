import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import { assertTransition } from '../../domain/expense-lifecycle.js';
import {
  buildExpenseDetailResponse,
  type ExpenseDetailResponseDto,
} from '../dto/expense.response.js';
import { assertCanArchiveExpense } from '../policies/expense-authorization.policy.js';
import { EXPENSE_AUDIT_ACTIONS, logExpenseAudit } from '../services/expense-audit.service.js';

export class ArchiveExpenseUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(expenseId: string, auth: AuthorizationContext): Promise<ExpenseDetailResponseDto> {
    assertCanArchiveExpense(auth);

    const existing = await this.expenseRepository.findByIdIncludingArchived(
      expenseId,
      auth.companyId,
    );
    if (!existing) throw new ResourceNotFoundError('Expense not found');
    if (existing.isArchived()) {
      throw new LifecycleConflictError('Expense is already archived.');
    }
    assertTransition(existing.status, 'archive', auth.role, { isOwner: false });

    await this.expenseRepository.archive(expenseId, auth.companyId);

    logExpenseAudit({
      action: EXPENSE_AUDIT_ACTIONS.ARCHIVED,
      companyId: auth.companyId,
      resourceType: 'expense',
      resourceId: expenseId,
      actorUserId: auth.userId,
    });

    const detail = await this.expenseRepository.findDetailById(expenseId, auth.companyId, {
      includeArchived: true,
    });
    if (!detail) throw new ResourceNotFoundError('Expense not found');
    return buildExpenseDetailResponse(detail);
  }
}
