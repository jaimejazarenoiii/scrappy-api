import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import type {
  ListTransactionsQuery,
  TransactionRepository,
} from '../../domain/transaction.repository.js';
import { assertCanListCompanyTransactions } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionSummaryResponse,
  type TransactionSummaryResponseDto,
} from '../dto/transaction.response.js';

export interface ListTransactionsResponseDto {
  items: TransactionSummaryResponseDto[];
  meta: PaginationMeta;
}

export class ListTransactionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    auth: AuthorizationContext,
    query: ListTransactionsQuery,
  ): Promise<ListTransactionsResponseDto> {
    assertCanListCompanyTransactions(auth);
    const result = await this.transactionRepository.listByCompany(auth.companyId, query);
    return {
      items: result.items.map(buildTransactionSummaryResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
