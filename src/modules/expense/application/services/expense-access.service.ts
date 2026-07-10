import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { ExpenseEntity } from '../../domain/expense.entity.js';

export interface ExpenseOwnershipContext {
  actingEmployeeId: string | null;
}

export async function resolveExpenseOwnershipContext(
  userRepository: UserRepository,
  auth: AuthorizationContext,
): Promise<ExpenseOwnershipContext> {
  if (auth.role === 'OWNER' || auth.role === 'MANAGER') {
    const user = await userRepository.findById(auth.userId, auth.companyId);
    return { actingEmployeeId: user?.employeeId ?? null };
  }
  const actingEmployeeId = await resolveActingEmployeeIdForUser(
    userRepository,
    auth.companyId,
    auth.userId,
  );
  return { actingEmployeeId };
}

export function isExpenseOwner(expense: ExpenseEntity, actingEmployeeId: string | null): boolean {
  return actingEmployeeId !== null && expense.isOwnedByEmployee(actingEmployeeId);
}
