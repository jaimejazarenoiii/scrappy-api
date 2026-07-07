import type {
  AttendanceResponseDto,
  AttendanceStatusResponseDto,
} from '../../../attendance/application/dto/attendance.response.js';
import type { CashAdvanceResponseDto } from '../../../cash-advance/application/dto/cash-advance.response.js';
import type { LeaveResponseDto } from '../../../leave/application/dto/leave.response.js';
import type { PayrollResponseDto } from '../../../payroll/application/dto/payroll.response.js';

export interface DashboardVisibilityFlags {
  canTimeIn: boolean;
  canTimeOut: boolean;
  canCreateTransaction: boolean;
  canCreateExpense: boolean;
}

export interface CashAdvanceSummaryDto {
  outstandingBalance: number;
  recentAdvances: CashAdvanceResponseDto[];
}

export interface WorkforceDashboardResponseDto {
  attendanceStatus: AttendanceStatusResponseDto;
  attendanceSummary: AttendanceResponseDto[];
  leaveSummary: LeaveResponseDto[];
  cashAdvanceSummary: CashAdvanceSummaryDto;
  payrollSummary: PayrollResponseDto[];
  tripsSummary: unknown[];
  transactionsSummary: unknown[];
  visibility: DashboardVisibilityFlags;
}
