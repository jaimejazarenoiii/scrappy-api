import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { CurrentLocationRepository } from '../../domain/current-location.repository.js';
import type { TrackingStatusResponseDto } from '../dto/current-location.response.js';
import { assertCanViewEmployeeLocation } from '../policies/tracking-authorization.policy.js';
import { TrackingStatusService } from '../services/tracking-status.service.js';

export class GetEmployeeTrackingStatusUseCase {
  constructor(
    private readonly currentLocationRepository: CurrentLocationRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly statusService: TrackingStatusService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    employeeId: string,
  ): Promise<TrackingStatusResponseDto> {
    assertCanViewEmployeeLocation(auth, employeeId);

    const employee = await this.employeeRepository.findById(employeeId, auth.companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');

    const location = await this.currentLocationRepository.findByEmployeeId(
      employeeId,
      auth.companyId,
    );

    return {
      employeeId,
      tripId: location?.toPrimitives().tripId ?? null,
      trackingStatus: this.statusService.resolve(location),
      lastSeenAt: location ? location.toPrimitives().lastSeenAt.toISOString() : null,
    };
  }
}
