import type { LeaveStatus, LeaveType } from '../../domain/leave-status.js';

export interface LeaveResponseDto {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: LeaveType;
  leaveDate: Date;
  status: LeaveStatus;
  reason: string | null;
  managerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}
