import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { UpdateTripLoadRequestDto } from '../dto/trip-load.request.js';
import { toTripLoadDto, type TripLoadDto } from '../dto/trip-load.response.js';
import { assertCanMutateTripLoad, assertDraftOnly } from '../policies/trip-load-mutation.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class UpdateTripLoadUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: UpdateTripLoadRequestDto,
  ): Promise<TripLoadDto> {
    assertCanMutateTripLoad(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertDraftOnly(trip);

    const load = await this.tripLoadRepository.findByTripId(tripId);
    if (!load) throw new ResourceNotFoundError('Trip load not found');

    const updated = await this.tripLoadRepository.updateNotes(load.id, {
      notes: input.notes ?? null,
      updatedByUserId: auth.userId,
    });

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_UPDATED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { tripLoadId: load.id },
    });

    return toTripLoadDto(updated);
  }
}
