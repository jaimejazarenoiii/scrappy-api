import type {
  AttendanceSessionRepository,
  ListAttendanceQuery,
} from '../../domain/attendance-session.repository.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { AttendanceResponseDto } from '../dto/attendance.response.js';

function toResponse(session: { toPrimitives(): AttendanceResponseDto }): AttendanceResponseDto {
  return session.toPrimitives();
}

export class ListCompanyAttendanceUseCase {
  constructor(private readonly attendanceRepository: AttendanceSessionRepository) {}

  async execute(companyId: string, query: ListAttendanceQuery) {
    const result = await this.attendanceRepository.listByCompany(companyId, query);
    return {
      items: result.items.map(toResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
