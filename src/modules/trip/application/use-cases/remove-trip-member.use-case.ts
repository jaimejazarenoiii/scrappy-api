import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertEditable } from '../../domain/trip-rules.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class RemoveTripMemberUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(tripId: string, memberId: string, auth: AuthorizationContext): Promise<void> {
    assertCanManageTrips(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertEditable(trip, auth.role);

    await this.tripRepository.removeMember(tripId, auth.companyId, memberId);

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.MEMBER_REMOVED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { memberId },
    });
  }
}
