import { isAllowedSubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { TripEntity } from '../../../trip/domain/trip.entity.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type {
  GetTrackingSessionQueryDto,
  TrackingSessionResponseDto,
  TrackingSessionTripDto,
} from '../dto/tracking-session.response.js';

function toSessionTrip(trip: TripEntity): TrackingSessionTripDto {
  const props = trip.toPrimitives();
  return {
    id: props.id,
    tripNumber: props.tripNumber,
    status: props.status,
    origin: props.origin,
    destination: props.destination,
    scheduledStart: props.scheduledStart.toISOString(),
    actualStart: props.actualStart?.toISOString() ?? null,
  };
}

/**
 * Resolves authoritative tracking session state for the Tracking Application.
 */
export class TrackingSessionService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly tripRepository: TripRepository,
  ) {}

  async resolve(
    auth: AuthorizationContext,
    query: GetTrackingSessionQueryDto = {},
  ): Promise<TrackingSessionResponseDto> {
    const synchronizedAt = new Date().toISOString();

    const company = await this.companyRepository.findById(auth.companyId);
    if (!company || !isAllowedSubscriptionStatus(company.subscriptionStatus)) {
      return {
        sessionState: 'COMPANY_SUBSCRIPTION_INACTIVE',
        canTrack: false,
        synchronizedAt,
      };
    }

    const user = await this.userRepository.findById(auth.userId, auth.companyId);
    const employeeId = user?.employeeId ?? null;
    if (!employeeId) {
      return {
        sessionState: 'EMPLOYEE_NOT_ASSIGNED',
        canTrack: false,
        synchronizedAt,
      };
    }

    const employee = await this.employeeRepository.findById(employeeId, auth.companyId);
    if (!employee?.isActive()) {
      return {
        sessionState: 'EMPLOYEE_INACTIVE',
        canTrack: false,
        employeeId,
        synchronizedAt,
      };
    }

    const startedTrip = await this.tripRepository.findStartedTripByEmployee(
      employeeId,
      auth.companyId,
    );
    if (startedTrip) {
      return {
        sessionState: 'ACTIVE_TRIP',
        canTrack: true,
        employeeId,
        trip: toSessionTrip(startedTrip),
        synchronizedAt,
      };
    }

    if (query.lastKnownTripId) {
      const knownTrip = await this.tripRepository.findById(query.lastKnownTripId, auth.companyId);
      if (knownTrip) {
        const status = knownTrip.toPrimitives().status;
        const member = await this.tripRepository.findMemberByTripAndEmployee(
          query.lastKnownTripId,
          auth.companyId,
          employeeId,
        );
        if (member && (status === 'COMPLETED' || status === 'CANCELLED')) {
          return {
            sessionState: 'TRIP_ENDED',
            canTrack: false,
            employeeId,
            endedTrip: toSessionTrip(knownTrip),
            synchronizedAt,
          };
        }
      }
    }

    return {
      sessionState: 'NO_ACTIVE_TRIP',
      canTrack: false,
      employeeId,
      synchronizedAt,
    };
  }
}
