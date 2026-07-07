import type {
  LeaveRecordRepository,
  ListLeaveQuery,
} from '../../domain/leave-record.repository.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { LeaveResponseDto } from '../dto/leave.response.js';

function toResponse(record: { toPrimitives(): LeaveResponseDto }): LeaveResponseDto {
  return record.toPrimitives();
}

export class ListCompanyLeaveUseCase {
  constructor(private readonly leaveRepository: LeaveRecordRepository) {}

  async execute(companyId: string, query: ListLeaveQuery) {
    const result = await this.leaveRepository.listByCompany(companyId, query);
    return {
      items: result.items.map(toResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
