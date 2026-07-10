import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import {
  buildExpenseDetailResponse,
  type ExpenseDetailResponseDto,
} from '../dto/expense.response.js';
import { assertCanViewExpense } from '../policies/expense-authorization.policy.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export class GetExpenseByNumberUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    expenseNumber: string,
    auth: AuthorizationContext,
  ): Promise<ExpenseDetailResponseDto> {
    const expense = await this.expenseRepository.findByExpenseNumber(expenseNumber, auth.companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');

    const detail = await this.expenseRepository.findDetailById(expense.id, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(detail.expense, actingEmployeeId);
    assertCanViewExpense(auth, { isOwner });

    return buildExpenseDetailResponse(detail);
  }
}
