import {
  DuplicateResourceError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import { assertEditable } from '../../domain/trip-rules.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { AddTripMembersRequestDto } from '../dto/trip-member.request.js';
import { toTripDetailDto, type TripDetailDto } from '../dto/trip-detail.response.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';

export class AddTripMembersUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(
    tripId: string,
    auth: AuthorizationContext,
    input: AddTripMembersRequestDto,
  ): Promise<TripDetailDto> {
    assertCanManageTrips(auth.role);

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');
    assertEditable(trip, auth.role);

    const uniqueIds = new Set(input.members.map((member) => member.employeeId));
    if (uniqueIds.size !== input.members.length) {
      throw new ValidationAppError('Duplicate trip members are not allowed.', [
        { path: 'employeeIds', message: 'Each employee may only appear once.' },
      ]);
    }

    for (const member of input.members) {
      const employee = await this.employeeRepository.findById(member.employeeId, auth.companyId);
      if (!employee) throw new ResourceNotFoundError('Employee not found');

      const employeeProps = employee.toPrimitives();
      if (employeeProps.deletedAt || employeeProps.status !== 'ACTIVE') {
        throw new ValidationAppError('Only active employees can be assigned to trips.', [
          { path: 'employeeIds', message: `Employee ${member.employeeId} is not active.` },
        ]);
      }

      const existing = await this.tripRepository.findMemberByTripAndEmployee(
        tripId,
        auth.companyId,
        member.employeeId,
      );
      if (existing) {
        throw new DuplicateResourceError('Employee is already assigned to this trip.');
      }

      const created = await this.tripRepository.addMember(tripId, auth.companyId, member);

      logTripAudit({
        action: TRIP_AUDIT_ACTIONS.MEMBER_ADDED,
        companyId: auth.companyId,
        resourceType: 'trip',
        resourceId: tripId,
        actorUserId: auth.userId,
        metadata: { memberId: created.id, employeeId: member.employeeId, role: member.role },
      });
    }

    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    return toTripDetailDto(detail);
  }
}
