import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import type { CurrentLocationRepository } from '../../domain/current-location.repository.js';
import type { TripTrackingLocationsResponseDto } from '../dto/current-location.response.js';
import { toCurrentLocationSummaryDto } from '../mappers/current-location.mapper.js';
import { assertCanViewTracking } from '../policies/tracking-authorization.policy.js';

export class GetTripTrackingLocationsUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly currentLocationRepository: CurrentLocationRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    tripId: string,
  ): Promise<TripTrackingLocationsResponseDto> {
    assertCanViewTracking(auth);

    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    const locations = await this.currentLocationRepository.findByTripId(auth.companyId, tripId);
    const locationByEmployee = new Map(
      locations.map((loc) => [loc.toPrimitives().employeeId, loc]),
    );

    return {
      tripId: detail.id,
      tripNumber: detail.tripNumber,
      tripStatus: detail.status,
      trackingActive: detail.status === 'STARTED',
      employees: detail.members.map((member) => {
        const location = locationByEmployee.get(member.employeeId) ?? null;
        const summary = toCurrentLocationSummaryDto(location, detail.tripNumber);
        return {
          employeeId: member.employeeId,
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role,
          location: { ...summary, employeeId: member.employeeId },
        };
      }),
    };
  }
}
