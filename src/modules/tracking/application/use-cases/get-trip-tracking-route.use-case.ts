import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import type { LocationHistoryRepository } from '../../domain/location-history.repository.js';
import type { GetTripRouteQueryDto, TripRouteResponseDto } from '../dto/trip-route.response.js';
import { assertCanReadRouteHistory } from '../policies/tracking-authorization.policy.js';

export class GetTripTrackingRouteUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly locationHistoryRepository: LocationHistoryRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    tripId: string,
    query: GetTripRouteQueryDto,
  ): Promise<TripRouteResponseDto> {
    assertCanReadRouteHistory(auth);

    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    let members = detail.members;
    if (query.employeeId) {
      members = members.filter((member) => member.employeeId === query.employeeId);
    }

    const employees = await Promise.all(
      members.map(async (member) => {
        const route = await this.locationHistoryRepository.findRoutePoints({
          tripId,
          companyId: auth.companyId,
          employeeId: member.employeeId,
          page: query.page,
          limit: query.limit,
          sortOrder: query.sortOrder,
        });

        return {
          employeeId: member.employeeId,
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role,
          points: route.points.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            capturedAt: point.capturedAt.toISOString(),
            accuracy: point.accuracy,
            speed: point.speed,
            heading: point.heading,
            batteryLevel: point.batteryLevel,
          })),
          meta: {
            total: route.total,
            page: query.page,
            limit: query.limit,
          },
        };
      }),
    );

    return {
      tripId: detail.id,
      tripNumber: detail.tripNumber,
      tripStatus: detail.status,
      employees,
    };
  }
}
