import {
  ForbiddenError,
  LifecycleConflictError,
} from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import type { TripEntity } from '../../domain/trip.entity.js';

const MANAGER_ROLES: UserRole[] = ['OWNER', 'MANAGER'];

/** Enable/disable flags and company load settings — Owner/Manager only. */
export function assertCanManageTripLoadSettings(role: UserRole): void {
  if (!MANAGER_ROLES.includes(role)) {
    throw new ForbiddenError('You do not have permission to modify trip load settings.');
  }
}

/**
 * Create/update/delete load content (items + notes).
 * Owner/Manager always; Employee only when assigned to the trip.
 */
export function assertCanMutateTripLoad(
  auth: AuthorizationContext,
  opts: { isMember: boolean },
): void {
  if (auth.role === 'OWNER' || auth.role === 'MANAGER') return;
  if (auth.role === 'EMPLOYEE' && opts.isMember) return;
  throw new ForbiddenError('You do not have permission to modify this trip load.');
}

export function assertDraftOnly(trip: TripEntity): void {
  if (!trip.isDraft()) {
    throw new LifecycleConflictError('Trip load can only be modified while the trip is in Draft.');
  }
}
