import type { AttendanceSessionStatus } from '../../modules/attendance/domain/attendance-status.js';

export interface OperationalAttendanceSession {
  status: AttendanceSessionStatus;
}

/**
 * Returns whether an employee is operationally ready based on an open attendance session.
 */
export function isOperationallyReady(session: OperationalAttendanceSession | null): boolean {
  return session !== null && session.status === 'OPEN';
}
