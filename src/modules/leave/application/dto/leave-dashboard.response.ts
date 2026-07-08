import type { LeaveResponseDto } from './leave.response.js';

export interface LeaveDashboardSummaryDto {
  totalEmployees: number;
  pendingRequests: number;
  onLeaveToday: number;
  approvedThisWeek: number;
}

export interface LeaveDashboardEmployeeDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
  pendingRequests: number;
  onLeaveToday: boolean;
  todayLeave: LeaveResponseDto | null;
  pendingLeave: LeaveResponseDto[];
}

export interface LeaveDashboardResponseDto {
  date: string;
  summary: LeaveDashboardSummaryDto;
  employees: LeaveDashboardEmployeeDto[];
}
