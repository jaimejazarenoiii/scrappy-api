import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanListCompanyTrips } from '../policies/trip-authorization.policy.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import type { TripDashboardResponseDto } from '../dto/trip-dashboard.response.js';

export class GetTripDashboardUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(auth: AuthorizationContext): Promise<TripDashboardResponseDto> {
    assertCanListCompanyTrips(auth.role);
    return this.tripRepository.getDashboardCounts(auth.companyId);
  }
}
