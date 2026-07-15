import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { EnableTripLoadRequestDto } from '../dto/trip-load.request.js';
import { type TripLoadFlagsDto } from '../dto/trip-load.response.js';
import {
  assertCanManageTripLoadSettings,
  assertDraftOnly,
} from '../policies/trip-load-mutation.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class EnableTripLoadUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: EnableTripLoadRequestDto,
  ): Promise<TripLoadFlagsDto> {
    assertCanManageTripLoadSettings(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertDraftOnly(trip);

    let strictLoadValidation = input.strictLoadValidation;
    if (strictLoadValidation === undefined) {
      const company = await this.companyRepository.findById(auth.companyId);
      strictLoadValidation = company?.defaultStrictLoadValidation ?? false;
    }

    const updated = await this.tripRepository.updateLoadFlags(tripId, auth.companyId, {
      strictLoadValidation,
      updatedByUserId: auth.userId,
    });

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.LOAD_ENABLED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { strictLoadValidation },
    });

    return {
      tripId,
      loadEnabled: updated.loadEnabled,
      strictLoadValidation: updated.strictLoadValidation,
    };
  }
}
