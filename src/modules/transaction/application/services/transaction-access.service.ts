import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';

export async function resolveActingEmployeeIdForUser(
  userRepository: UserRepository,
  companyId: string,
  userId: string,
): Promise<string> {
  const user = await userRepository.findById(userId, companyId);
  if (!user) throw new ResourceNotFoundError('User not found');
  return resolveActingEmployeeId(user);
}

/**
 * Resolves whether the acting principal is assigned to the transaction. Owners and managers are
 * always considered authorized (returns true); employees are checked against their assignment.
 */
export async function resolveIsAssigned(
  deps: { userRepository: UserRepository; transactionRepository: TransactionRepository },
  auth: AuthorizationContext,
  transactionId: string,
): Promise<boolean> {
  if (auth.role !== 'EMPLOYEE') return true;
  const employeeId = await resolveActingEmployeeIdForUser(
    deps.userRepository,
    auth.companyId,
    auth.userId,
  );
  return deps.transactionRepository.isEmployeeAssigned(transactionId, employeeId);
}
