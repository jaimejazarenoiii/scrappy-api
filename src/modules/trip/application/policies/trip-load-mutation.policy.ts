import {
  ForbiddenError,
  LifecycleConflictError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import type { TripEntity } from '../../domain/trip.entity.js';

const LOAD_MUTATION_ROLES: UserRole[] = ['OWNER', 'MANAGER'];

export function assertCanMutateTripLoad(role: UserRole): void {
  if (!LOAD_MUTATION_ROLES.includes(role)) {
    throw new ForbiddenError('You do not have permission to modify this trip load.');
  }
}

export function assertDraftOnly(trip: TripEntity): void {
  if (!trip.isDraft()) {
    throw new LifecycleConflictError('Trip load can only be modified while the trip is in Draft.');
  }
}
