import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import type { ExpenseRepository, ListExpensesQuery } from '../../domain/expense.repository.js';
import {
  buildExpenseSummaryResponse,
  type ExpenseSummaryResponseDto,
} from '../dto/expense.response.js';
import { assertCanListCompanyExpenses } from '../policies/expense-authorization.policy.js';

export interface ListExpensesResponseDto {
  items: ExpenseSummaryResponseDto[];
  meta: PaginationMeta;
}

export class ListExpensesUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(
    auth: AuthorizationContext,
    query: ListExpensesQuery,
  ): Promise<ListExpensesResponseDto> {
    assertCanListCompanyExpenses(auth);
    const normalized: ListExpensesQuery = {
      ...query,
      sortBy: query.sortBy ?? 'expenseDate',
      sortOrder: query.sortOrder ?? 'desc',
    };
    const result = await this.expenseRepository.listByCompany(auth.companyId, normalized);
    return {
      items: result.items.map(buildExpenseSummaryResponse),
      meta: buildPaginationMeta(normalized.page, normalized.limit, result.total),
    };
  }
}
