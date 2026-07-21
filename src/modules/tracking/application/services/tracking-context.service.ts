import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertEmployeeIsTripMember, assertStartedTrip } from '../../domain/tracking-rules.js';

export interface ResolvedTrackingContext {
  employeeId: string;
  tripId: string;
  tripNumber: string;
}

/**
 * Resolves authenticated employee and their active Started trip for location transmission.
 */
export class TrackingContextService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tripRepository: TripRepository,
  ) {}

  async resolveForTransmit(auth: AuthorizationContext): Promise<ResolvedTrackingContext> {
    const employeeId = await resolveActingEmployeeIdForUser(
      this.userRepository,
      auth.companyId,
      auth.userId,
    );

    const trip = assertStartedTrip(
      await this.tripRepository.findStartedTripByEmployee(employeeId, auth.companyId),
    );
    const tripId = trip.toPrimitives().id;
    const member = await this.tripRepository.findMemberByTripAndEmployee(
      tripId,
      auth.companyId,
      employeeId,
    );
    assertEmployeeIsTripMember(member, employeeId);

    return {
      employeeId,
      tripId,
      tripNumber: trip.toPrimitives().tripNumber,
    };
  }
}
