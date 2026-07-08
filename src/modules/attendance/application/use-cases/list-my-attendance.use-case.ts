import type {
  AttendanceSessionRepository,
  ListAttendanceQuery,
} from '../../domain/attendance-session.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { isWorkforceTrackingRequired } from '../../../../shared/workforce/workforce-role-policy.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { AttendanceResponseDto } from '../dto/attendance.response.js';

function toResponse(session: { toPrimitives(): AttendanceResponseDto }): AttendanceResponseDto {
  return session.toPrimitives();
}

export class ListMyAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(companyId: string, userId: string, query: ListAttendanceQuery) {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');

    if (!isWorkforceTrackingRequired(user.role)) {
      return {
        items: [],
        meta: buildPaginationMeta(query.page, query.limit, 0),
      };
    }

    const employeeId = resolveActingEmployeeId(user);
    const result = await this.attendanceRepository.listByEmployee(employeeId, companyId, query);
    return {
      items: result.items.map(toResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
