import { randomUUID } from 'node:crypto';
import {
  DuplicateResourceError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { normalizeMaterialName } from '../../domain/material-name.js';
import type { TripLoadRepository } from '../../domain/trip-load.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { CreateTripLoadRequestDto } from '../dto/trip-load.request.js';
import { toTripLoadDto, type TripLoadDto } from '../dto/trip-load.response.js';
import { assertCanMutateTripLoad, assertDraftOnly } from '../policies/trip-load-mutation.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class CreateTripLoadUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripLoadRepository: TripLoadRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: CreateTripLoadRequestDto,
  ): Promise<TripLoadDto> {
    assertCanMutateTripLoad(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertDraftOnly(trip);

    const existing = await this.tripLoadRepository.findByTripId(tripId);
    if (existing) throw new DuplicateResourceError('Trip load already exists for this trip.');

    const seen = new Set<string>();
    const items = input.items.map((item) => {
      const materialName = item.materialName.trim();
      const materialNameNorm = normalizeMaterialName(materialName);
      const key = `${materialNameNorm}|${item.unit}`;
      if (seen.has(key)) {
        throw new ValidationAppError('Duplicate materials are not allowed in a trip load.', [
          { path: 'items', message: `Material ${materialName} (${item.unit}) is duplicated.` },
        ]);
      }
      seen.add(key);
      return {
        id: randomUUID(),
        materialName,
        materialNameNorm,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes ?? null,
      };
    });

    const load = await this.tripLoadRepository.create({
      id: randomUUID(),
      tripId,
      notes: input.notes ?? null,
      createdByUserId: auth.userId,
      items,
    });

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_CREATED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { tripLoadId: load.id, itemCount: items.length },
    });

    return toTripLoadDto(load);
  }
}
