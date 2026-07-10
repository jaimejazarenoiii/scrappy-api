import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository, ListExpensesQuery } from '../../domain/expense.repository.js';
import {
  buildExpenseSummaryResponse,
  type ExpenseSummaryResponseDto,
} from '../dto/expense.response.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';

export interface ListMyExpensesResponseDto {
  items: ExpenseSummaryResponseDto[];
  meta: PaginationMeta;
}

export class ListMyExpensesUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ListExpensesQuery,
  ): Promise<ListMyExpensesResponseDto> {
    const employeeId = await resolveActingEmployeeIdForUser(
      this.userRepository,
      auth.companyId,
      auth.userId,
    );
    const user = await this.userRepository.findById(auth.userId, auth.companyId);
    if (!user) throw new ResourceNotFoundError('User not found');

    const normalized: ListExpensesQuery = {
      ...query,
      sortBy: query.sortBy ?? 'expenseDate',
      sortOrder: query.sortOrder ?? 'desc',
    };
    const result = await this.expenseRepository.listByEmployee(
      auth.companyId,
      employeeId,
      normalized,
    );
    return {
      items: result.items.map(buildExpenseSummaryResponse),
      meta: buildPaginationMeta(normalized.page, normalized.limit, result.total),
    };
  }
}
