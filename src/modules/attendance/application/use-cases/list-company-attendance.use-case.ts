import type {
  AttendanceSessionRepository,
  ListAttendanceQuery,
} from '../../domain/attendance-session.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { CompanyAttendanceResponseDto } from '../dto/attendance.response.js';
import {
  buildEmployeeSummaryLookup,
  withEmployeeSummary,
} from '../../../../shared/workforce/employee-summary.js';

export class ListCompanyAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(companyId: string, query: ListAttendanceQuery) {
    const result = await this.attendanceRepository.listByCompany(companyId, query);
    const employeeIds = [
      ...new Set(result.items.map((session) => session.toPrimitives().employeeId)),
    ];
    const employees = await this.employeeRepository.findByIds(employeeIds, companyId);
    const employeeLookup = buildEmployeeSummaryLookup(employees);

    const items: CompanyAttendanceResponseDto[] = result.items.map((session) =>
      withEmployeeSummary(session.toPrimitives(), employeeLookup),
    );

    return {
      items,
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
