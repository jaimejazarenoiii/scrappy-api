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
import { assertCanRecordExpense } from '../policies/expense-authorization.policy.js';
import { EXPENSE_AUDIT_ACTIONS, logExpenseAudit } from '../services/expense-audit.service.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export class RecordExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(expenseId: string, auth: AuthorizationContext): Promise<ExpenseDetailResponseDto> {
    const existing = await this.expenseRepository.findById(expenseId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(existing, actingEmployeeId);
    assertCanRecordExpense(auth, { isOwner });
    assertNotArchived(existing);
    assertTransition(existing.status, 'record', auth.role, { isOwner });

    const now = new Date();
    await this.expenseRepository.record(expenseId, auth.companyId, {
      recordedByUserId: auth.userId,
      recordedAt: now,
      updatedByUserId: auth.userId,
    });

    logExpenseAudit({
      action: EXPENSE_AUDIT_ACTIONS.RECORDED,
      companyId: auth.companyId,
      resourceType: 'expense',
      resourceId: expenseId,
      actorUserId: auth.userId,
    });

    const detail = await this.expenseRepository.findDetailById(expenseId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Expense not found');
    return buildExpenseDetailResponse(detail);
  }
}
