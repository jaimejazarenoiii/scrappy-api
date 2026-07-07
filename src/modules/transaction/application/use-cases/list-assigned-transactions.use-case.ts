import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type {
  ListTransactionsQuery,
  TransactionRepository,
} from '../../domain/transaction.repository.js';
import {
  buildTransactionSummaryResponse,
  type TransactionSummaryResponseDto,
} from '../dto/transaction.response.js';
import { resolveActingEmployeeIdForUser } from '../services/transaction-access.service.js';

export interface ListAssignedTransactionsResponseDto {
  items: TransactionSummaryResponseDto[];
  meta: PaginationMeta;
}

export class ListAssignedTransactionsUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ListTransactionsQuery,
  ): Promise<ListAssignedTransactionsResponseDto> {
    const employeeId = await resolveActingEmployeeIdForUser(
      this.userRepository,
      auth.companyId,
      auth.userId,
    );
    const result = await this.transactionRepository.listAssigned(auth.companyId, employeeId, query);
    return {
      items: result.items.map(buildTransactionSummaryResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
