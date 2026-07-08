import type { LeaveRecordEntity } from './leave-record.entity.js';
import type { LeaveStatus, LeaveType } from './leave-status.js';

export interface CreateLeaveRecordInput {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: LeaveType;
  leaveDate: Date;
  reason?: string | null;
  createdByUserId?: string | null;
}

export interface ManageLeaveInput {
  status?: LeaveStatus;
  managerNote?: string | null;
  leaveType?: LeaveType;
  leaveDate?: Date;
  reason?: string | null;
  updatedByUserId?: string | null;
}

export interface ListLeaveQuery {
  page: number;
  limit: number;
  sortBy?: 'leaveDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  fromDate?: Date;
  toDate?: Date;
  employeeId?: string;
  status?: LeaveStatus;
}

export interface ListLeaveResult {
  items: LeaveRecordEntity[];
  total: number;
}

export interface LeaveRecordRepository {
  create(input: CreateLeaveRecordInput): Promise<LeaveRecordEntity>;
  findById(leaveId: string, companyId: string): Promise<LeaveRecordEntity | null>;
  findOverlapping(
    employeeId: string,
    companyId: string,
    leaveDate: Date,
    excludeLeaveId?: string,
  ): Promise<LeaveRecordEntity | null>;
  update(leaveId: string, companyId: string, input: ManageLeaveInput): Promise<LeaveRecordEntity>;
  listByEmployee(
    employeeId: string,
    companyId: string,
    query: ListLeaveQuery,
  ): Promise<ListLeaveResult>;
  listByCompany(companyId: string, query: ListLeaveQuery): Promise<ListLeaveResult>;
}
