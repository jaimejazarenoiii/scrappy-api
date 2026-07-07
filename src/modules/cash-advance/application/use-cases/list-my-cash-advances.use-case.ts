import type {
  CashAdvanceRepository,
  ListCashAdvanceQuery,
} from '../../domain/cash-advance.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { CashAdvanceResponseDto } from '../dto/cash-advance.response.js';
import type { CashAdvanceEntity } from '../../domain/cash-advance.entity.js';

function toResponse(advance: CashAdvanceEntity): CashAdvanceResponseDto {
  const { createdByUserId: _, ...rest } = advance.toPrimitives();
  return rest;
}

export class ListMyCashAdvancesUseCase {
  constructor(
    private readonly cashAdvanceRepository: CashAdvanceRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(companyId: string, userId: string, query: ListCashAdvanceQuery) {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');

    const employeeId = resolveActingEmployeeId(user);
    const result = await this.cashAdvanceRepository.listByEmployee(employeeId, companyId, query);

    return {
      items: result.items.map(toResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
