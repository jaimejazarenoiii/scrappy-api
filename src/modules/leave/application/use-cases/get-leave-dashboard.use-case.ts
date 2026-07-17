import {
  addUtcDays,
  endOfUtcDay,
  formatUtcDate,
  isSameUtcDay,
  parseDateInput,
  phWeekday,
  startOfUtcDay,
} from '../../../../shared/datetime/day-boundaries.js';
import type { LeaveRecordRepository } from '../../domain/leave-record.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { LeaveDashboardResponseDto } from '../dto/leave-dashboard.response.js';

const DASHBOARD_LIST_LIMIT = 10_000;

export class GetLeaveDashboardUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly leaveRepository: LeaveRecordRepository,
  ) {}

  async execute(companyId: string, dateInput?: string): Promise<LeaveDashboardResponseDto> {
    const day = parseDateInput(dateInput);
    const weekStart = startOfUtcDay(addUtcDays(day, -((phWeekday(day) + 6) % 7)));
    const weekEnd = endOfUtcDay(addUtcDays(weekStart, 6));

    const employees = await this.employeeRepository.listActiveByCompany(companyId);
    const [todayLeavesResult, pendingLeavesResult, approvedWeekResult] = await Promise.all([
      this.leaveRepository.listByCompany(companyId, {
        page: 1,
        limit: DASHBOARD_LIST_LIMIT,
        fromDate: startOfUtcDay(day),
        toDate: endOfUtcDay(day),
      }),
      this.leaveRepository.listByCompany(companyId, {
        page: 1,
        limit: DASHBOARD_LIST_LIMIT,
        status: 'PENDING',
      }),
      this.leaveRepository.listByCompany(companyId, {
        page: 1,
        limit: DASHBOARD_LIST_LIMIT,
        fromDate: weekStart,
        toDate: weekEnd,
        status: 'APPROVED',
      }),
    ]);

    const todayLeaves = todayLeavesResult.items.map((leave) => leave.toPrimitives());
    const pendingLeaves = pendingLeavesResult.items.map((leave) => leave.toPrimitives());
    const approvedWeek = approvedWeekResult.items.map((leave) => leave.toPrimitives());

    const employeeRows = employees.map((employee) => {
      const employeeId = employee.id;
      const employeePending = pendingLeaves.filter((leave) => leave.employeeId === employeeId);
      const todayLeave =
        todayLeaves.find(
          (leave) =>
            leave.employeeId === employeeId &&
            leave.status === 'APPROVED' &&
            isSameUtcDay(leave.leaveDate, day),
        ) ?? null;

      return {
        employeeId,
        firstName: employee.toPrimitives().firstName,
        lastName: employee.toPrimitives().lastName,
        employeeNumber: employee.toPrimitives().employeeNumber,
        pendingRequests: employeePending.length,
        onLeaveToday: todayLeave !== null,
        todayLeave,
        pendingLeave: employeePending,
      };
    });

    return {
      date: formatUtcDate(day),
      summary: {
        totalEmployees: employees.length,
        pendingRequests: pendingLeaves.length,
        onLeaveToday: employeeRows.filter((row) => row.onLeaveToday).length,
        approvedThisWeek: approvedWeek.length,
      },
      employees: employeeRows,
    };
  }
}
