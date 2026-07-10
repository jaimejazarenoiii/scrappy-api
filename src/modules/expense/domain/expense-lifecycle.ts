import type { UserRole } from '../../../shared/policy/roles.js';
import { ForbiddenError, LifecycleConflictError } from '../../../shared/errors/http-exceptions.js';
import type { ExpenseStatus } from './expense-status.js';

export type ExpenseAction = 'record' | 'cancel' | 'archive';

export function assertTransition(
  from: ExpenseStatus,
  action: ExpenseAction,
  role: UserRole,
  opts: { isOwner: boolean },
): void {
  if (action === 'archive') {
    if (from !== 'RECORDED' && from !== 'CANCELLED') {
      throw new LifecycleConflictError('Only recorded or cancelled expenses can be archived.');
    }
    if (role === 'EMPLOYEE') {
      throw new ForbiddenError('Only managers and owners can archive expenses.');
    }
    return;
  }

  if (from === 'CANCELLED') {
    throw new LifecycleConflictError('Cancelled expenses are immutable.');
  }

  if (action === 'record') {
    if (from !== 'DRAFT') {
      throw new LifecycleConflictError('Only draft expenses can be recorded.');
    }
    if (role === 'EMPLOYEE' && !opts.isOwner) {
      throw new ForbiddenError('Employees can only record their own draft expenses.');
    }
    return;
  }

  if (action === 'cancel') {
    if (from === 'DRAFT') {
      if (role === 'EMPLOYEE' && !opts.isOwner) {
        throw new ForbiddenError('Employees can only cancel their own draft expenses.');
      }
      return;
    }
    if (from === 'RECORDED') {
      if (role === 'EMPLOYEE') {
        throw new ForbiddenError('Employees cannot cancel recorded expenses.');
      }
      return;
    }
  }

  throw new LifecycleConflictError('Invalid expense lifecycle transition.');
}
