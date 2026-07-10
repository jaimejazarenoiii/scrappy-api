import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { assertCanViewTrip } from '../policies/trip-authorization.policy.js';
import { buildTripHistory, type TripHistoryDto } from '../dto/trip-history.response.js';

export class GetTripHistoryUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(tripId: string, auth: AuthorizationContext): Promise<TripHistoryDto> {
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

    const trip = await this.tripRepository.findById(tripId, auth.companyId);
    if (!trip) throw new ResourceNotFoundError('Trip not found');

    return buildTripHistory(tripId, trip.toPrimitives());
  }
}
