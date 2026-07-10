import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import { assertTransition } from '../../domain/expense-lifecycle.js';
import { assertNotArchived } from '../../domain/expense-rules.js';
import {
  buildExpenseDetailResponse,
  type ExpenseDetailResponseDto,
} from '../dto/expense.response.js';
import { assertCanCancelExpense } from '../policies/expense-authorization.policy.js';
import { EXPENSE_AUDIT_ACTIONS, logExpenseAudit } from '../services/expense-audit.service.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export interface CancelExpenseRequestDto {
  reason: string;
}

export class CancelExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    expenseId: string,
    auth: AuthorizationContext,
    input: CancelExpenseRequestDto,
  ): Promise<ExpenseDetailResponseDto> {
    const existing = await this.expenseRepository.findById(expenseId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(existing, actingEmployeeId);
    assertCanCancelExpense(auth, { isOwner, isRecorded: existing.isRecorded() });
    assertNotArchived(existing);
    assertTransition(existing.status, 'cancel', auth.role, { isOwner });

    const now = new Date();
    await this.expenseRepository.cancel(expenseId, auth.companyId, {
      cancelledByUserId: auth.userId,
      cancelledAt: now,
      cancellationReason: input.reason,
      updatedByUserId: auth.userId,
    });

    logExpenseAudit({
      action: EXPENSE_AUDIT_ACTIONS.CANCELLED,
      companyId: auth.companyId,
      resourceType: 'expense',
      resourceId: expenseId,
      actorUserId: auth.userId,
      metadata: { reason: input.reason },
    });

    const detail = await this.expenseRepository.findDetailById(expenseId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Expense not found');
    return buildExpenseDetailResponse(detail);
  }
}
