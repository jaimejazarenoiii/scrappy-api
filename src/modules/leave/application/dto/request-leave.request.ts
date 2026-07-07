import { leaveTypeSchema, optionalNoteSchema } from '../../../../validations/workforce.schemas.js';
import type { LeaveType } from '../../domain/leave-status.js';

export interface RequestLeaveRequestDto {
  leaveType: LeaveType;
  leaveDate: Date;
  reason?: string;
}

export const requestLeaveRequestShape = {
  leaveType: leaveTypeSchema,
  leaveDate: 'date',
  reason: optionalNoteSchema,
};

export interface ManageLeaveRequestDto {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  managerNote?: string;
}
