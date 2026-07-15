import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { UpdateTripLoadRequestDto } from '../dto/trip-load.request.js';
import { toTripLoadDto, type TripLoadDto } from '../dto/trip-load.response.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { requireTripLoadContentMutationAccess } from '../services/trip-load-access.service.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class UpdateTripLoadUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: UpdateTripLoadRequestDto,
  ): Promise<TripLoadDto> {
    await requireTripLoadContentMutationAccess(
      this.tripRepository,
      this.userRepository,
      tripId,
      auth,
    );

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
