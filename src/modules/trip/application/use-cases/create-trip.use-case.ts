import { randomUUID } from 'node:crypto';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { VehicleRepository } from '../../../vehicle/domain/vehicle.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { CreateTripRequestDto } from '../dto/create-trip.request.js';
import { toTripDetailDto, type TripDetailDto } from '../dto/trip-detail.response.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';
import { logTripAudit, TRIP_AUDIT_ACTIONS } from '../services/trip-audit.service.js';
import type { TripNumberService } from '../services/trip-number.service.js';

export class CreateTripUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly tripNumberService: TripNumberService,
    private readonly vehicleRepository: VehicleRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(auth: AuthorizationContext, input: CreateTripRequestDto): Promise<TripDetailDto> {
    assertCanManageTrips(auth.role);

    const vehicle = await this.vehicleRepository.findById(input.vehicleId, auth.companyId);
    if (!vehicle) throw new ResourceNotFoundError('Vehicle not found');
    const vehicleProps = vehicle.toPrimitives();
    if (vehicleProps.deletedAt) {
      throw new BusinessRuleViolationError('Archived vehicles cannot be assigned to trips.');
    }
    if (vehicleProps.status === 'MAINTENANCE' || vehicleProps.status === 'INACTIVE') {
      throw new BusinessRuleViolationError('Vehicle is not available for trip assignment.');
    }
    if (vehicleProps.status === 'IN_USE') {
      throw new BusinessRuleViolationError('Vehicle is currently in use on another trip.');
    }

    const members = input.members ?? [];
    const memberEmployeeIds = members.map((member) => member.employeeId);
    const uniqueMemberIds = new Set(memberEmployeeIds);
    if (uniqueMemberIds.size !== memberEmployeeIds.length) {
      throw new ValidationAppError('Duplicate trip members are not allowed.', [
        { path: 'members', message: 'Each employee may only appear once.' },
      ]);
    }

    for (const member of members) {
      const employee = await this.employeeRepository.findById(member.employeeId, auth.companyId);
      if (!employee) {
        throw new ResourceNotFoundError('Employee not found');
      }
      const employeeProps = employee.toPrimitives();
      if (employeeProps.deletedAt || employeeProps.status !== 'ACTIVE') {
        throw new BusinessRuleViolationError('Only active employees can be assigned to trips.');
      }
    }

    const tripNumber = await this.tripNumberService.allocate(auth.companyId, input.scheduledStart);
    const tripId = randomUUID();

    await this.tripRepository.create({
      id: tripId,
      companyId: auth.companyId,
      tripNumber,
      vehicleId: input.vehicleId,
      status: 'DRAFT',
      scheduledStart: input.scheduledStart,
      origin: input.origin,
      destination: input.destination,
      notes: input.notes ?? null,
      createdByUserId: auth.userId,
      updatedByUserId: auth.userId,
      members,
    });

    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    logTripAudit({
      action: TRIP_AUDIT_ACTIONS.CREATED,
      companyId: auth.companyId,
      resourceType: 'trip',
      resourceId: tripId,
      actorUserId: auth.userId,
      metadata: { tripNumber, memberCount: members.length },
    });

    return toTripDetailDto(detail);
  }
}
