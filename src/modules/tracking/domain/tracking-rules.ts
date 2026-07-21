import {
  BusinessRuleViolationError,
  ForbiddenError,
} from '../../../shared/errors/http-exceptions.js';
import type { TripEntity } from '../../trip/domain/trip.entity.js';
import type { TripMemberEntity } from '../../trip/domain/trip-member.entity.js';

export function assertNotMockLocation(isMockLocation: boolean | undefined): void {
  if (isMockLocation) {
    throw new ForbiddenError('Mock GPS locations are not accepted.');
  }
}

export function assertStartedTrip(trip: TripEntity | null): TripEntity {
  if (!trip || trip.toPrimitives().status !== 'STARTED') {
    throw new BusinessRuleViolationError(
      'Tracking is not permitted. No active Started trip is available for this employee.',
      [{ code: 'NO_ACTIVE_TRIP', message: 'Location updates require an active Started trip.' }],
    );
  }
  return trip;
}

export function assertEmployeeIsTripMember(
  member: TripMemberEntity | null,
  employeeId: string,
): void {
  if (!member || member.toPrimitives().employeeId !== employeeId) {
    throw new BusinessRuleViolationError('Employee is not assigned to this trip.');
  }
}
