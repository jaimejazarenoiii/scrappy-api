import {
  BusinessRuleViolationError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../shared/policy/roles.js';
import type { TripEntity } from './trip.entity.js';

export function assertNotArchived(trip: TripEntity): void {
  if (trip.isArchived()) throw new LifecycleConflictError('Archived trips cannot be modified.');
}

export function assertEditable(trip: TripEntity, role: UserRole): void {
  assertNotArchived(trip);
  trip.assertEditableBy(role);
}

export function assertHasMembers(memberCount: number): void {
  if (memberCount < 1) {
    throw new ValidationAppError('At least one trip member is required.', [
      { path: 'members', message: 'At least one trip member is required.' },
    ]);
  }
}

export function assertStartRequiresPlanningFields(trip: TripEntity): void {
  // TripEntity already owns the lifecycle invariant; this is just “payload completeness”.
  if (!trip.toPrimitives().vehicleId) {
    throw new ValidationAppError('vehicleId is required to start a trip.');
  }
  const { origin, destination, scheduledStart } = trip.toPrimitives();
  if (!origin?.trim()) throw new ValidationAppError('origin is required to start a trip.');
  if (!destination?.trim())
    throw new ValidationAppError('destination is required to start a trip.');
  if (!(scheduledStart instanceof Date) || Number.isNaN(scheduledStart.getTime())) {
    throw new ValidationAppError('scheduledStart must be a valid date.');
  }
}

export function assertNoActiveTripForVehicle(existingStartedTrip: TripEntity | null): void {
  if (existingStartedTrip) {
    throw new BusinessRuleViolationError('This vehicle is already assigned to an active trip.');
  }
}

export function assertNoActiveTripForEmployee(existingStartedTrip: TripEntity | null): void {
  if (existingStartedTrip) {
    throw new BusinessRuleViolationError('This employee is already assigned to an active trip.');
  }
}

export function assertStartable(trip: TripEntity, role: UserRole, memberCount: number): void {
  assertNotArchived(trip);
  trip.assertStartable(role);
  assertHasMembers(memberCount);
  assertStartRequiresPlanningFields(trip);
}

export function assertCompletable(trip: TripEntity, role: UserRole): void {
  assertNotArchived(trip);
  trip.assertCompletable(role);
}

export function assertCancellable(
  trip: TripEntity,
  role: UserRole,
  cancellationReason: string,
): void {
  assertNotArchived(trip);
  trip.assertCancellable(role);
  if (!cancellationReason?.trim()) {
    throw new ValidationAppError('Cancellation reason is required.', [
      { path: 'reason', message: 'Cancellation reason is required.' },
    ]);
  }
}

export function assertArchivable(trip: TripEntity): void {
  assertNotArchived(trip);
  trip.assertArchivable();
}
