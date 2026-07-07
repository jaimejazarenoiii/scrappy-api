import type { AttendanceSessionEntity } from './attendance-session.entity.js';

export interface CreateAttendanceSessionInput {
  id: string;
  companyId: string;
  employeeId: string;
  timeInAt?: Date;
  note?: string | null;
  createdByUserId?: string | null;
}

export interface ManageAttendanceInput {
  correctionNote?: string;
  adjustedTimeInAt?: Date;
  adjustedTimeOutAt?: Date;
  updatedByUserId?: string | null;
}

export interface ListAttendanceQuery {
  page: number;
  limit: number;
  sortBy?: 'timeInAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  fromDate?: Date;
  toDate?: Date;
  employeeId?: string;
}

export interface ListAttendanceResult {
  items: AttendanceSessionEntity[];
  total: number;
}

export interface AttendanceSessionRepository {
  create(input: CreateAttendanceSessionInput): Promise<AttendanceSessionEntity>;
  findOpenSession(employeeId: string, companyId: string): Promise<AttendanceSessionEntity | null>;
  findById(attendanceId: string, companyId: string): Promise<AttendanceSessionEntity | null>;
  update(
    attendanceId: string,
    companyId: string,
    input: ManageAttendanceInput,
  ): Promise<AttendanceSessionEntity>;
  close(
    attendanceId: string,
    companyId: string,
    timeOutAt: Date,
    note?: string | null,
  ): Promise<AttendanceSessionEntity>;
  listByEmployee(
    employeeId: string,
    companyId: string,
    query: ListAttendanceQuery,
  ): Promise<ListAttendanceResult>;
  listByCompany(companyId: string, query: ListAttendanceQuery): Promise<ListAttendanceResult>;
}
