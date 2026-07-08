import type { AttendanceSessionRepository } from '../../../attendance/domain/attendance-session.repository.js';
import type { AttendanceResponseDto } from '../../../attendance/application/dto/attendance.response.js';
import type { CashAdvanceRepository } from '../../../cash-advance/domain/cash-advance.repository.js';
import type { CashAdvanceResponseDto } from '../../../cash-advance/application/dto/cash-advance.response.js';
import type { LeaveRecordRepository as LeaveRepository } from '../../../leave/domain/leave-record.repository.js';
import type { LeaveResponseDto } from '../../../leave/application/dto/leave.response.js';
import type { PayrollRecordRepository as PayrollRepository } from '../../../payroll/domain/payroll-record.repository.js';
import type { PayrollResponseDto } from '../../../payroll/application/dto/payroll.response.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { isWorkforceTrackingRequired } from '../../../../shared/workforce/workforce-role-policy.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { WorkforceDashboardResponseDto } from '../dto/workforce-dashboard.response.js';
import { DashboardVisibilityService } from '../services/dashboard-visibility.service.js';

const RECENT_SUMMARY_LIMIT = 5;

function toAttendanceResponse(session: {
  toPrimitives(): AttendanceResponseDto;
}): AttendanceResponseDto {
  return session.toPrimitives();
}

function toLeaveResponse(record: { toPrimitives(): LeaveResponseDto }): LeaveResponseDto {
  return record.toPrimitives();
}

function toCashAdvanceResponse(advance: {
  toPrimitives(): CashAdvanceResponseDto & { createdByUserId?: string | null };
}): CashAdvanceResponseDto {
  const { createdByUserId: _, ...rest } = advance.toPrimitives();
  return rest;
}

function toPayrollResponse(record: { toPrimitives(): PayrollResponseDto }): PayrollResponseDto {
  return record.toPrimitives();
}

export class GetWorkforceDashboardUseCase {
  constructor(
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly leaveRepository: LeaveRepository,
    private readonly cashAdvanceRepository: CashAdvanceRepository,
    private readonly payrollRepository: PayrollRepository,
    private readonly userRepository: UserRepository,
    private readonly dashboardVisibilityService: DashboardVisibilityService,
  ) {}

  async execute(companyId: string, userId: string): Promise<WorkforceDashboardResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');

    if (!isWorkforceTrackingRequired(user.role)) {
      return {
        attendanceStatus: {
          isTimedIn: false,
          openSession: null,
        },
        attendanceSummary: [],
        leaveSummary: [],
        cashAdvanceSummary: {
          outstandingBalance: 0,
          recentAdvances: [],
        },
        payrollSummary: [],
        tripsSummary: [],
        transactionsSummary: [],
        visibility: this.dashboardVisibilityService.resolve(null, user.role),
      };
    }

    const employeeId = resolveActingEmployeeId(user);
    const openSession = await this.attendanceRepository.findOpenSession(employeeId, companyId);

    const recentQuery = { page: 1, limit: RECENT_SUMMARY_LIMIT, sortOrder: 'desc' as const };

    const [attendanceResult, leaveResult, cashAdvanceResult, outstandingBalance, payrollResult] =
      await Promise.all([
        this.attendanceRepository.listByEmployee(employeeId, companyId, {
          ...recentQuery,
          sortBy: 'timeInAt',
        }),
        this.leaveRepository.listByEmployee(employeeId, companyId, {
          ...recentQuery,
          sortBy: 'leaveDate',
        }),
        this.cashAdvanceRepository.listByEmployee(employeeId, companyId, {
          ...recentQuery,
          sortBy: 'createdAt',
        }),
        this.cashAdvanceRepository.sumOutstandingBalance(employeeId, companyId),
        this.payrollRepository.listByEmployee(employeeId, companyId, {
          ...recentQuery,
          sortBy: 'payPeriodStart',
        }),
      ]);

    return {
      attendanceStatus: {
        isTimedIn: openSession !== null,
        openSession: openSession ? toAttendanceResponse(openSession) : null,
      },
      attendanceSummary: attendanceResult.items.map(toAttendanceResponse),
      leaveSummary: leaveResult.items.map(toLeaveResponse),
      cashAdvanceSummary: {
        outstandingBalance,
        recentAdvances: cashAdvanceResult.items.map(toCashAdvanceResponse),
      },
      payrollSummary: payrollResult.items.map(toPayrollResponse),
      tripsSummary: [],
      transactionsSummary: [],
      visibility: this.dashboardVisibilityService.resolve(openSession, user.role),
    };
  }
}
