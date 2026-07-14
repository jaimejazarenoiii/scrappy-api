import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { assertCanMutateTripLoad, assertDraftOnly } from '../policies/trip-load-mutation.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class RemoveTripLoadItemUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
  ) {}

  async execute(
    tripId: string,
    itemId: string,
    auth: AuthorizationContext,
  ): Promise<{ id: string; deleted: true }> {
    assertCanMutateTripLoad(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertDraftOnly(trip);

    const load = await this.tripLoadRepository.findByTripId(tripId);
    if (!load) throw new ResourceNotFoundError('Trip load not found');

    const current = load.items.find((item) => item.id === itemId);
    if (!current) throw new ResourceNotFoundError('Trip load item not found');

    await this.tripLoadRepository.removeItem(load.id, itemId);

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_ITEM_REMOVED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { tripLoadId: load.id, tripLoadItemId: itemId },
    });

    return { id: itemId, deleted: true };
  }
}
