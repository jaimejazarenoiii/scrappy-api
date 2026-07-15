import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { normalizeMaterialName } from '../../domain/material-name.js';
import type {
  TripLoadRepository,
  UpdateTripLoadItemInput,
} from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { UpdateTripLoadItemRequestDto } from '../dto/trip-load.request.js';
import { toTripLoadItemDto, type TripLoadItemDto } from '../dto/trip-load.response.js';
import { requireTripLoadContentMutationAccess } from '../services/trip-load-access.service.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class UpdateTripLoadItemUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    tripId: string,
    itemId: string,
    auth: AuthorizationContext,
    input: UpdateTripLoadItemRequestDto,
  ): Promise<TripLoadItemDto> {
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

    const nextName =
      input.materialName !== undefined ? input.materialName.trim() : current.materialName;
    const nextNameNorm = normalizeMaterialName(nextName);
    const nextUnit = input.unit ?? current.unit;

    const duplicate = load.items.some(
      (item) =>
        item.id !== itemId && item.materialNameNorm === nextNameNorm && item.unit === nextUnit,
    );
    if (duplicate) {
      throw new ValidationAppError('Duplicate materials are not allowed in a trip load.', [
        { path: 'materialName', message: `Material ${nextName} (${nextUnit}) already exists.` },
      ]);
    }

    const update: UpdateTripLoadItemInput = { updatedByUserId: auth.userId };
    if (input.materialName !== undefined) {
      update.materialName = nextName;
      update.materialNameNorm = nextNameNorm;
    }
    if (input.quantity !== undefined) update.quantity = input.quantity;
    if (input.unit !== undefined) update.unit = input.unit;
    if (input.notes !== undefined) update.notes = input.notes;

    const item = await this.tripLoadRepository.updateItem(load.id, itemId, update);

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_ITEM_UPDATED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { tripLoadId: load.id, tripLoadItemId: itemId },
    });

    return toTripLoadItemDto(item);
  }
}
