import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { type TripLoadFlagsDto } from '../dto/trip-load.response.js';
import { requireTripLoadContentMutationAccess } from '../services/trip-load-access.service.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class DeleteTripLoadUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(tripId: string, auth: AuthorizationContext): Promise<TripLoadFlagsDto> {
    await requireTripLoadContentMutationAccess(
      this.tripRepository,
      this.userRepository,
      tripId,
      auth,
    );

    const load = await this.tripLoadRepository.findByTripId(tripId);
    if (!load) throw new ResourceNotFoundError('Trip load not found');

    await this.tripLoadRepository.deleteByTripId(tripId);
    const updatedTrip = await this.tripRepository.updateLoadFlags(tripId, auth.companyId, {
      updatedByUserId: auth.userId,
    });

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_DELETED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { tripLoadId: load.id },
    });

    return {
      tripId,
      loadEnabled: updatedTrip.loadEnabled,
      strictLoadValidation: updatedTrip.strictLoadValidation,
    };
  }
}
