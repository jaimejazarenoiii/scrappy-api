import type { AttendanceSessionStatus } from '../../modules/attendance/domain/attendance-status.js';
import type { UserRole } from '../policy/roles.js';
import { isWorkforceTrackingRequired } from './workforce-role-policy.js';

export interface OperationalAttendanceSession {
  status: AttendanceSessionStatus;
}

/**
 * Returns whether an employee is operationally ready based on an open attendance session.
 */
export function isOperationallyReady(session: OperationalAttendanceSession | null): boolean {
  return session !== null && session.status === 'OPEN';
}

/**
 * Owners are always operationally ready; managers and employees require an open session.
 */
export function isOperationallyReadyForRole(
  session: OperationalAttendanceSession | null,
  role: UserRole,
): boolean {
  if (!isWorkforceTrackingRequired(role)) {
    return true;
  }
  return isOperationallyReady(session);
}
