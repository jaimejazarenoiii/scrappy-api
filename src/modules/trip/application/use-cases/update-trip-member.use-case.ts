import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertEditable } from '../../domain/trip-rules.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { UpdateTripMemberRequestDto } from '../dto/trip-member.request.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export interface TripMemberResponseDto {
  id: string;
  tripId: string;
  employeeId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdateTripMemberUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(
    tripId: string,
    memberId: string,
    auth: AuthorizationContext,
    input: UpdateTripMemberRequestDto,
  ): Promise<TripMemberResponseDto> {
    assertCanManageTrips(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertEditable(trip, auth.role);

    const updated = await this.tripRepository.updateMember(tripId, auth.companyId, memberId, input);
    const props = updated.toPrimitives();

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.MEMBER_UPDATED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { memberId, role: input.role },
    });

    return props;
  }
}
