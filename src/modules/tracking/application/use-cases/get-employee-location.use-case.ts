import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { CurrentLocationRepository } from '../../domain/current-location.repository.js';
import { toCurrentLocationSummaryDto } from '../mappers/current-location.mapper.js';
import { assertCanViewEmployeeLocation } from '../policies/tracking-authorization.policy.js';

export class GetEmployeeLocationUseCase {
  constructor(
    private readonly currentLocationRepository: CurrentLocationRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly tripRepository: TripRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(auth: AuthorizationContext, employeeId: string) {
    let resolvedEmployeeId: string | undefined;
    if (auth.role === 'EMPLOYEE') {
      resolvedEmployeeId = await resolveActingEmployeeIdForUser(
        this.userRepository,
        auth.companyId,
        auth.userId,
      );
    }
    assertCanViewEmployeeLocation(auth, employeeId, resolvedEmployeeId);

    const employee = await this.employeeRepository.findById(employeeId, auth.companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');

    const location = await this.currentLocationRepository.findByEmployeeId(
      employeeId,
      auth.companyId,
    );

    let tripNumber: string | null = null;
    const tripId = location?.toPrimitives().tripId;
    if (tripId) {
      const trip = await this.tripRepository.findById(tripId, auth.companyId);
      tripNumber = trip?.toPrimitives().tripNumber ?? null;
    }

    const summary = toCurrentLocationSummaryDto(location, tripNumber);
    return { ...summary, employeeId };
  }
}
