import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../../transaction/domain/transaction.repository.js';
import { buildTransactionSummaryResponse } from '../../../transaction/application/dto/transaction.response.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';
import type { TripRepository } from '../../domain/trip.repository.js';
import { assertCanViewTrip } from '../policies/trip-authorization.policy.js';
import type { ListTripTransactionsQuery } from '../../presentation/trip.schemas.js';

export class ListTripTransactionsUseCase {
  constructor(
    private readonly tripRepository: TripRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(tripId: string, auth: AuthorizationContext, query: ListTripTransactionsQuery) {
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

    const result = await this.transactionRepository.listByCompany(auth.companyId, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      tripId,
      includeArchived: query.includeArchived,
    });

    return {
      items: result.items.map(buildTransactionSummaryResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
