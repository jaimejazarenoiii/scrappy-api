import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ListTripQuery, TripRepository } from '../../domain/trip.repository.js';
import type { TripSummaryDto } from '../dto/trip.response.js';

export interface ListMyTripsResponseDto {
  items: TripSummaryDto[];
  meta: PaginationMeta;
}

export class ListMyTripsUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(auth: AuthorizationContext, query: ListTripQuery): Promise<ListMyTripsResponseDto> {
    const employeeId = await resolveActingEmployeeIdForUser(
      this.userRepository,
      auth.companyId,
      auth.userId,
    );

    const normalized: ListTripQuery = {
      ...query,
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy ?? 'scheduledStart',
      sortOrder: query.sortOrder ?? 'desc',
      employeeId,
    };

    const result = await this.tripRepository.listSummariesByCompany(auth.companyId, normalized);
    return {
      items: result.items,
      meta: buildPaginationMeta(normalized.page, normalized.limit, result.total),
    };
  }
}
