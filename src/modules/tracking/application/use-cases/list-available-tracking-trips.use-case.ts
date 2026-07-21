import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { TripRepository } from '../../../trip/domain/trip.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TripSummaryDto } from '../../../trip/application/dto/trip.response.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import { assertCanTransmitLocation } from '../policies/tracking-authorization.policy.js';

const AVAILABLE_TRIPS_LIMIT = 50;

export interface ListAvailableTrackingTripsResponseDto {
  items: TripSummaryDto[];
  meta: PaginationMeta;
}

export class ListAvailableTrackingTripsUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(auth: AuthorizationContext): Promise<ListAvailableTrackingTripsResponseDto> {
    assertCanTransmitLocation(auth);

    const employeeId = await resolveActingEmployeeIdForUser(
      this.userRepository,
      auth.companyId,
      auth.userId,
    );

    const result = await this.tripRepository.listMine(auth.companyId, employeeId, {
      page: 1,
      limit: AVAILABLE_TRIPS_LIMIT,
      status: 'STARTED',
      sortBy: 'scheduledStart',
      sortOrder: 'desc',
    });

    return {
      items: result.items,
      meta: buildPaginationMeta(1, AVAILABLE_TRIPS_LIMIT, result.total),
    };
  }
}
