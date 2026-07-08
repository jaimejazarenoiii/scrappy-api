import type { UserRole } from '../../../shared/policy/roles.js';
import { LifecycleConflictError } from '../../../shared/errors/http-exceptions.js';
import type { TransactionStatus } from './transaction-status.js';

export type TransactionAction = 'finish' | 'return_to_draft' | 'settle' | 'reopen' | 'cancel';

function actorLabel(role: UserRole): string {
  return role.toLowerCase();
}

export function assertTransition(
  from: TransactionStatus,
  action: TransactionAction,
  role: UserRole,
): void {
  if (action === 'finish') {
    if (from !== 'DRAFT') {
      throw new LifecycleConflictError('Only draft transactions can be submitted for settlement.');
    }
    return;
  }

  if (action === 'return_to_draft') {
    if (from !== 'READY_FOR_PAYMENT') {
      throw new LifecycleConflictError(
        'Only ready-for-payment transactions can be returned to draft.',
      );
    }
    if (role === 'EMPLOYEE') {
      throw new LifecycleConflictError('Employees cannot return transactions to draft.');
    }
    return;
  }

  if (action === 'settle') {
    if (from !== 'READY_FOR_PAYMENT') {
      throw new LifecycleConflictError('Only ready-for-payment transactions can be settled.');
    }
    if (role === 'EMPLOYEE') {
      throw new LifecycleConflictError('Employees cannot settle transactions.');
    }
    return;
  }

  if (action === 'reopen') {
    if (from !== 'PAID') {
      throw new LifecycleConflictError('Only paid transactions can be reopened.');
    }
    if (role !== 'OWNER') {
      throw new LifecycleConflictError('Only owners can reopen paid transactions.');
    }
    return;
  }

  if (action === 'cancel') {
    if (from === 'PAID') {
      throw new LifecycleConflictError('Paid transactions must be reopened before cancellation.');
    }
    if (from === 'CANCELLED') {
      throw new LifecycleConflictError('Cancelled transactions cannot be modified.');
    }
    if (from !== 'DRAFT' && from !== 'READY_FOR_PAYMENT') {
      throw new LifecycleConflictError(
        `Cannot cancel a transaction from the ${actorLabel(role)} workflow.`,
      );
    }
  }
}
