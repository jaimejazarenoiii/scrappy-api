import type { AttendanceSessionRepository } from '../../domain/attendance-session.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { LeaveRecordRepository } from '../../../leave/domain/leave-record.repository.js';
import {
  endOfUtcDay,
  parseDateInput,
  startOfUtcDay,
} from '../../../../shared/datetime/day-boundaries.js';
import type { AttendanceDashboardResponseDto } from '../dto/attendance-dashboard.response.js';
import { AttendanceDayStatusService } from '../services/attendance-day-status.service.js';

const DASHBOARD_LIST_LIMIT = 10_000;

export class GetAttendanceDashboardUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly leaveRepository: LeaveRecordRepository,
    private readonly attendanceDayStatusService: AttendanceDayStatusService,
  ) {}

  async execute(companyId: string, dateInput?: string): Promise<AttendanceDashboardResponseDto> {
    const day = parseDateInput(dateInput);
    const fromDate = startOfUtcDay(day);
    const toDate = endOfUtcDay(day);

    const employees = await this.employeeRepository.listActiveByCompany(companyId);
    const [sessionsResult, approvedLeavesResult, openSessions] = await Promise.all([
      this.attendanceRepository.listByCompany(companyId, {
        page: 1,
        limit: DASHBOARD_LIST_LIMIT,
        fromDate,
        toDate,
        sortBy: 'timeInAt',
        sortOrder: 'asc',
      }),
      this.leaveRepository.listByCompany(companyId, {
        page: 1,
        limit: DASHBOARD_LIST_LIMIT,
        fromDate,
        toDate,
        status: 'APPROVED',
      }),
      Promise.all(
        employees.map((employee) =>
          this.attendanceRepository.findOpenSession(employee.id, companyId),
        ),
      ),
    ]);

    return this.attendanceDayStatusService.buildDashboard({
      day,
      employees: employees.map((employee) => employee.toPrimitives()),
      sessions: sessionsResult.items.map((session) => session.toPrimitives()),
      openSessions: openSessions.map((session) => (session ? session.toPrimitives() : null)),
      approvedLeavesToday: approvedLeavesResult.items.map((leave) => leave.toPrimitives()),
    });
  }
}
