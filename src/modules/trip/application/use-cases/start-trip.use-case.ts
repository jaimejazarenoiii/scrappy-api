import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { VehicleRepository } from '../../../vehicle/domain/vehicle.repository.js';
import {
  assertNoActiveTripForEmployee,
  assertNoActiveTripForVehicle,
  assertStartable,
} from '../../domain/trip-rules.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { StartTripRequestDto } from '../dto/start-trip.request.js';
import { toTripDetailDto, type TripDetailDto } from '../dto/trip-detail.response.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class StartTripUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: StartTripRequestDto = {},
  ): Promise<TripDetailDto> {
    assertCanManageTrips(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');

    const members = await this.tripRepository.listMembers(tripId, auth.companyId);
    assertStartable(trip, auth.role, members.length);

    const vehicleBusy = await this.tripRepository.findStartedTripByVehicle(
      trip.toPrimitives().vehicleId,
      auth.companyId,
    );
    if (vehicleBusy && vehicleBusy.id !== tripId) {
      assertNoActiveTripForVehicle(vehicleBusy);
    }

    for (const member of members) {
      const employeeBusy = await this.tripRepository.findStartedTripByEmployee(
        member.employeeId,
        auth.companyId,
      );
      if (employeeBusy && employeeBusy.id !== tripId) {
        assertNoActiveTripForEmployee(employeeBusy);
      }
    }

    const actualStart = new Date();
    await this.tripRepository.start(tripId, auth.companyId, {
      actualStart,
      startedByUserId: auth.userId,
      startingOdometer: input.startingOdometer ?? null,
    });

    await this.vehicleRepository.update(trip.toPrimitives().vehicleId, auth.companyId, {
      status: 'IN_USE',
      updatedByUserId: auth.userId,
    });

    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.STARTED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: {
        note: input.note ?? null,
        startingOdometer: input.startingOdometer ?? null,
      },
    });

    return toTripDetailDto(detail);
  }
}
