import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { requireTripLoadContentMutationAccess } from '../services/trip-load-access.service.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class RemoveTripLoadItemUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    tripId: string,
    itemId: string,
    auth: AuthorizationContext,
  ): Promise<{ id: string; deleted: true }> {
    await requireTripLoadContentMutationAccess(
      this.tripRepository,
      this.userRepository,
      tripId,
      auth,
    );

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
