import type { AttendanceResponseDto } from './attendance.response.js';
import type { LeaveResponseDto } from '../../../leave/application/dto/leave.response.js';

export type AttendanceDayStatus = 'ABSENT' | 'ON_TIME' | 'LATE' | 'TIMED_OUT' | 'ON_LEAVE';

export interface AttendanceDashboardSummaryDto {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  timedIn: number;
}

export interface AttendanceDashboardEmployeeDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
  status: AttendanceDayStatus;
  isTimedIn: boolean;
  isLate: boolean;
  isAbsent: boolean;
  onLeave: boolean;
  timeInToday: string | null;
  timeOutToday: string | null;
  openSession: AttendanceResponseDto | null;
  leaveToday: LeaveResponseDto | null;
}

export interface AttendanceDashboardResponseDto {
  date: string;
  summary: AttendanceDashboardSummaryDto;
  employees: AttendanceDashboardEmployeeDto[];
}
