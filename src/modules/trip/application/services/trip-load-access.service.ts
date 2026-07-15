import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TripEntity } from '../../domain/trip.entity.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { assertCanMutateTripLoad, assertDraftOnly } from '../policies/trip-load-mutation.policy.js';

/** Load draft trip and authorize content mutations (Owner/Manager or assigned Employee). */
export async function requireTripLoadContentMutationAccess(
  tripRepository: TripRepository,
  userRepository: UserRepository,
  tripId: string,
  auth: AuthorizationContext,
): Promise<TripEntity> {
  const trip = await tripRepository.findById(tripId, auth.companyId);
  if (!trip) throw new ResourceNotFoundError('Trip not found');
  assertDraftOnly(trip);

  let isMember = true;
  if (auth.role === 'EMPLOYEE') {
    const employeeId = await resolveActingEmployeeIdForUser(
      userRepository,
      auth.companyId,
      auth.userId,
    );
    const members = await tripRepository.listMembers(tripId, auth.companyId);
    isMember = members.some((member) => member.employeeId === employeeId);
  }

  assertCanMutateTripLoad(auth, { isMember });
  return trip;
}
