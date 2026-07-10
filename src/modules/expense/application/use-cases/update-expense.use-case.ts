import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import { assertEditable, assertPositiveAmount } from '../../domain/expense-rules.js';
import type { UpdateExpenseRequestDto } from '../dto/update-expense.request.js';
import {
  buildExpenseDetailResponse,
  type ExpenseDetailResponseDto,
} from '../dto/expense.response.js';
import { assertCanEditExpense } from '../policies/expense-authorization.policy.js';
import { EXPENSE_AUDIT_ACTIONS, logExpenseAudit } from '../services/expense-audit.service.js';
import type { ExpenseContextValidationService } from '../services/expense-context-validation.service.js';
import {
  isExpenseOwner,
  resolveExpenseOwnershipContext,
} from '../services/expense-access.service.js';

export class UpdateExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly userRepository: UserRepository,
    private readonly contextValidationService: ExpenseContextValidationService,
  ) {}

  async execute(
    expenseId: string,
    auth: AuthorizationContext,
    input: UpdateExpenseRequestDto,
  ): Promise<ExpenseDetailResponseDto> {
    const existing = await this.expenseRepository.findById(expenseId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Expense not found');

    const { actingEmployeeId } = await resolveExpenseOwnershipContext(this.userRepository, auth);
    const isOwner = isExpenseOwner(existing, actingEmployeeId);
    assertCanEditExpense(auth, { isOwner });
    assertEditable(existing, auth.role, isOwner);

    if (input.amount !== undefined) {
      assertPositiveAmount(input.amount);
    }

    const current = existing.toPrimitives();
    const mergedContext = {
      contextType: input.contextType ?? current.contextType,
      branchId: input.branchId !== undefined ? input.branchId : current.branchId,
      warehouseId: input.warehouseId !== undefined ? input.warehouseId : current.warehouseId,
      vehicleId: input.vehicleId !== undefined ? input.vehicleId : current.vehicleId,
      tripId: input.tripId !== undefined ? input.tripId : current.tripId,
    };
    await this.contextValidationService.validateReferences(auth.companyId, mergedContext);
    const contextFks = this.contextValidationService.resolveContextForeignKeys(mergedContext);

    const detail = await this.expenseRepository.update(expenseId, auth.companyId, {
      expenseDate: input.expenseDate,
      category: input.category,
      amount: input.amount,
      description: input.description,
      contextType: mergedContext.contextType,
      ...contextFks,
      updatedByUserId: auth.userId,
    });

    logExpenseAudit({
      action: EXPENSE_AUDIT_ACTIONS.UPDATED,
      companyId: auth.companyId,
      resourceType: 'expense',
      resourceId: expenseId,
      actorUserId: auth.userId,
    });

    return buildExpenseDetailResponse(detail);
  }
}
