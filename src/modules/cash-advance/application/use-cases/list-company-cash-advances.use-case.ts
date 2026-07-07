import type {
  CashAdvanceRepository,
  ListCashAdvanceQuery,
} from '../../domain/cash-advance.repository.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { CashAdvanceResponseDto } from '../dto/cash-advance.response.js';
import type { CashAdvanceEntity } from '../../domain/cash-advance.entity.js';

function toResponse(advance: CashAdvanceEntity): CashAdvanceResponseDto {
  const { createdByUserId: _, ...rest } = advance.toPrimitives();
  return rest;
}

export class ListCompanyCashAdvancesUseCase {
  constructor(private readonly cashAdvanceRepository: CashAdvanceRepository) {}

  async execute(companyId: string, query: ListCashAdvanceQuery) {
    const result = await this.cashAdvanceRepository.listByCompany(companyId, query);

    return {
      items: result.items.map(toResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
