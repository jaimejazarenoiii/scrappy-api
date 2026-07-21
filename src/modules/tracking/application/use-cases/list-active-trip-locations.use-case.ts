import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import type { CurrentLocationRepository } from '../../domain/current-location.repository.js';
import type {
  ActiveTripTrackingSummaryDto,
  ListActiveTripLocationsQueryDto,
} from '../dto/current-location.response.js';
import { toCurrentLocationSummaryDto } from '../mappers/current-location.mapper.js';
import { assertCanViewTracking } from '../policies/tracking-authorization.policy.js';

export class ListActiveTripLocationsUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly currentLocationRepository: CurrentLocationRepository,
  ) {}

  async execute(auth: AuthorizationContext, query: ListActiveTripLocationsQueryDto) {
    assertCanViewTracking(auth);

    if (query.tripId) {
      const detail = await this.tripRepository.findDetailById(query.tripId, auth.companyId);
      if (!detail || detail.status !== 'STARTED') {
        return {
          items: [],
          meta: buildPaginationMeta(query.page, query.limit, 0),
        };
      }
      const locations = await this.currentLocationRepository.findByTripId(
        auth.companyId,
        query.tripId,
      );
      return {
        items: [
          {
            tripId: detail.id,
            tripNumber: detail.tripNumber,
            tripStatus: detail.status,
            origin: detail.origin,
            destination: detail.destination,
            employees: locations.map((loc) => toCurrentLocationSummaryDto(loc, detail.tripNumber)),
          },
        ],
        meta: buildPaginationMeta(1, query.limit, 1),
      };
    }

    const listResult = await this.tripRepository.listSummariesByCompany(auth.companyId, {
      page: query.page,
      limit: query.limit,
      sortBy: 'scheduledStart',
      sortOrder: 'desc',
      status: 'STARTED',
      employeeId: query.employeeId,
    });

    const locations = await this.currentLocationRepository.findActiveByCompany(auth.companyId, {
      tripId: query.tripId,
      employeeId: query.employeeId,
    });
    const locationsByTrip = new Map<string, typeof locations>();
    for (const loc of locations) {
      const tripId = loc.toPrimitives().tripId;
      if (!tripId) continue;
      const bucket = locationsByTrip.get(tripId) ?? [];
      bucket.push(loc);
      locationsByTrip.set(tripId, bucket);
    }

    const items: ActiveTripTrackingSummaryDto[] = listResult.items.map((trip) => {
      const tripLocations = locationsByTrip.get(trip.id) ?? [];
      const locationByEmployee = new Map(
        tripLocations.map((loc) => [loc.toPrimitives().employeeId, loc]),
      );

      return {
        tripId: trip.id,
        tripNumber: trip.tripNumber,
        tripStatus: trip.status,
        origin: trip.origin,
        destination: trip.destination,
        employees: Array.from(locationByEmployee.values()).map((loc) =>
          toCurrentLocationSummaryDto(loc, trip.tripNumber),
        ),
      };
    });

    return {
      items,
      meta: buildPaginationMeta(query.page, query.limit, listResult.total),
    };
  }
}
