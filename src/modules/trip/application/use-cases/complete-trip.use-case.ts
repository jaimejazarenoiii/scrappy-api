import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { VehicleRepository } from '../../../vehicle/domain/vehicle.repository.js';
import { assertCompletable } from '../../domain/trip-rules.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { CompleteTripRequestDto } from '../dto/complete-trip.request.js';
import { toTripDetailDto, type TripDetailDto } from '../dto/trip-detail.response.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class CompleteTripUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: CompleteTripRequestDto = {},
  ): Promise<TripDetailDto> {
    assertCanManageTrips(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');

    assertCompletable(trip, auth.role);

    const actualEnd = new Date();
    await this.tripRepository.complete(tripId, auth.companyId, {
      actualEnd,
      completedByUserId: auth.userId,
      endingOdometer: input.endingOdometer ?? null,
    });

    await this.vehicleRepository.update(trip.toPrimitives().vehicleId, auth.companyId, {
      status: 'AVAILABLE',
      updatedByUserId: auth.userId,
    });

    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.COMPLETED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: {
        note: input.note ?? null,
        endingOdometer: input.endingOdometer ?? null,
      },
    });

    return toTripDetailDto(detail);
  }
}
