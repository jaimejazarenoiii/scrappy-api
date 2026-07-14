import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { type TripLoadFlagsDto } from '../dto/trip-load.response.js';
import { assertCanMutateTripLoad, assertDraftOnly } from '../policies/trip-load-mutation.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class DisableTripLoadUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
  ) {}

  async execute(tripId: string, auth: AuthorizationContext): Promise<TripLoadFlagsDto> {
    assertCanMutateTripLoad(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertDraftOnly(trip);

    await this.tripLoadRepository.deleteByTripId(tripId);
    const updated = await this.tripRepository.updateLoadFlags(tripId, auth.companyId, {
      strictLoadValidation: false,
      updatedByUserId: auth.userId,
    });

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_DISABLED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
    });

    return {
      tripId,
      loadEnabled: updated.loadEnabled,
      strictLoadValidation: updated.strictLoadValidation,
    };
  }
}
