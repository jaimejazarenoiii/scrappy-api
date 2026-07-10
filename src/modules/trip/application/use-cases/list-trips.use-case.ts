import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import { assertCanListCompanyTrips } from '../policies/trip-authorization.policy.js';
import type { TripRepository, ListTripQuery } from '../../domain/trip.repository.js';
import type { TripSummaryDto } from '../dto/trip.response.js';

export interface ListTripsResponseDto {
  items: TripSummaryDto[];
  meta: PaginationMeta;
}

export class ListTripsUseCase {
  constructor(private readonly tripRepository: TripRepository) {}

  async execute(auth: AuthorizationContext, query: ListTripQuery): Promise<ListTripsResponseDto> {
    assertCanListCompanyTrips(auth.role);
    const result = await this.tripRepository.listSummariesByCompany(auth.companyId, query);
    return {
      items: result.items,
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
