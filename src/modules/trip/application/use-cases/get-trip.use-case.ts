import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import { assertCanViewTrip } from '../policies/trip-authorization.policy.js';
import { toTripDetailDto, type TripDetailDto } from '../dto/trip-detail.response.js';

export class GetTripUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(tripId: string, auth: AuthorizationContext): Promise<TripDetailDto> {
    const detail = await this.tripRepository.findDetailById(tripId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Trip not found');

    let isMember = true;
    if (auth.role === 'EMPLOYEE') {
      const employeeId = await resolveActingEmployeeIdForUser(
        this.userRepository,
        auth.companyId,
        auth.userId,
      );
      isMember = detail.members.some((member) => member.employeeId === employeeId);
    }
    assertCanViewTrip(auth, { isMember });

    return toTripDetailDto(detail);
  }
}
