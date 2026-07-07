import type {
  LeaveRecordRepository,
  ListLeaveQuery,
} from '../../domain/leave-record.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { LeaveResponseDto } from '../dto/leave.response.js';

function toResponse(record: { toPrimitives(): LeaveResponseDto }): LeaveResponseDto {
  return record.toPrimitives();
}

export class ListMyLeaveUseCase {
  constructor(
    private readonly leaveRepository: LeaveRecordRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(companyId: string, userId: string, query: ListLeaveQuery) {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    const employeeId = resolveActingEmployeeId(user);
    const result = await this.leaveRepository.listByEmployee(employeeId, companyId, query);
    return {
      items: result.items.map(toResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
