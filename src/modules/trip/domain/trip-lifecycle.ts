import type { UserRole } from '../../../shared/policy/roles.js';
import { LifecycleConflictError } from '../../../shared/errors/http-exceptions.js';
import type { TripStatus } from './trip-status.js';

export type TripAction = 'start' | 'complete' | 'cancel';

function actorLabel(role: UserRole): string {
  return role.toLowerCase();
}

export function assertTransition(from: TripStatus, action: TripAction, role: UserRole): void {
  if (from === 'CANCELLED') {
    throw new LifecycleConflictError('Cancelled trips are immutable.');
  }
  if (from === 'COMPLETED') {
    throw new LifecycleConflictError('Completed trips are immutable.');
  }

  if (action === 'start') {
    if (from !== 'DRAFT') {
      throw new LifecycleConflictError('Only draft trips can be started.');
    }
    if (role === 'EMPLOYEE') {
      throw new LifecycleConflictError('Only managers and owners can start trips.');
    }
    return;
  }

  if (action === 'complete') {
    if (from !== 'STARTED') {
      throw new LifecycleConflictError('Only started trips can be completed.');
    }
    if (role === 'EMPLOYEE') {
      throw new LifecycleConflictError('Employees cannot complete trips.');
    }
    return;
  }

  if (action === 'cancel') {
    if (from !== 'DRAFT') {
      throw new LifecycleConflictError('Only draft trips can be cancelled.');
    }
    if (role === 'EMPLOYEE') {
      throw new LifecycleConflictError('Employees cannot cancel trips.');
    }
    return;
  }

  throw new LifecycleConflictError(`Unknown lifecycle transition for role ${actorLabel(role)}.`);
}
