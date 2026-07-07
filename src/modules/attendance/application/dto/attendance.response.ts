import type { AttendanceSessionStatus } from '../../domain/attendance-status.js';

export interface AttendanceResponseDto {
  id: string;
  companyId: string;
  employeeId: string;
  status: AttendanceSessionStatus;
  timeInAt: Date;
  timeOutAt: Date | null;
  note: string | null;
  correctionNote: string | null;
  adjustedTimeInAt: Date | null;
  adjustedTimeOutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceStatusResponseDto {
  isTimedIn: boolean;
  openSession: AttendanceResponseDto | null;
}
