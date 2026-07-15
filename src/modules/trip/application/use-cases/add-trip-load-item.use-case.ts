import { randomUUID } from 'node:crypto';
import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { normalizeMaterialName } from '../../domain/material-name.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { CreateTripLoadItemRequestDto } from '../dto/trip-load.request.js';
import { toTripLoadItemDto, type TripLoadItemDto } from '../dto/trip-load.response.js';
import { requireTripLoadContentMutationAccess } from '../services/trip-load-access.service.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class AddTripLoadItemUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: CreateTripLoadItemRequestDto,
  ): Promise<TripLoadItemDto> {
    await requireTripLoadContentMutationAccess(
      this.tripRepository,
      this.userRepository,
      tripId,
      auth,
    );

    const load = await this.tripLoadRepository.findByTripId(tripId);
    if (!load) throw new ResourceNotFoundError('Trip load not found');

    const materialName = input.materialName.trim();
    const materialNameNorm = normalizeMaterialName(materialName);
    const duplicate = load.items.some(
      (item) => item.materialNameNorm === materialNameNorm && item.unit === input.unit,
    );
    if (duplicate) {
      throw new ValidationAppError('Duplicate materials are not allowed in a trip load.', [
        {
          path: 'materialName',
          message: `Material ${materialName} (${input.unit}) already exists.`,
        },
      ]);
    }

    const item = await this.tripLoadRepository.addItem(load.id, {
      id: randomUUID(),
      materialName,
      materialNameNorm,
      quantity: input.quantity,
      unit: input.unit,
      notes: input.notes ?? null,
      updatedByUserId: auth.userId,
    });

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_ITEM_ADDED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { tripLoadId: load.id, tripLoadItemId: item.id },
    });

    return toTripLoadItemDto(item);
  }
}
