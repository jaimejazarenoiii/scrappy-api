import { randomUUID } from 'node:crypto';
import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { normalizeMaterialName } from '../../domain/material-name.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { CreateTripLoadItemRequestDto } from '../dto/trip-load.request.js';
import { toTripLoadItemDto, type TripLoadItemDto } from '../dto/trip-load.response.js';
import { assertCanMutateTripLoad, assertDraftOnly } from '../policies/trip-load-mutation.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class AddTripLoadItemUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: CreateTripLoadItemRequestDto,
  ): Promise<TripLoadItemDto> {
    assertCanMutateTripLoad(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertDraftOnly(trip);

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
