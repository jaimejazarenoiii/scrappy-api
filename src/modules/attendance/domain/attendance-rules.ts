import type { AttendanceSessionEntity } from './attendance-session.entity.js';
import type { EmployeeEntity } from '../../employee/domain/employee.entity.js';
import { LifecycleConflictError } from '../../../shared/errors/http-exceptions.js';

export function assertEmployeeCanTimeIn(employee: EmployeeEntity): void {
  if (!employee.isActive()) {
    throw new LifecycleConflictError('Archived or inactive employees cannot time in.');
  }
}

export function assertNoOpenSession(openSession: AttendanceSessionEntity | null): void {
  if (openSession) {
    throw new LifecycleConflictError('Employee is already timed in.');
  }
}

export function assertOpenSessionExists(openSession: AttendanceSessionEntity | null): void {
  if (!openSession) {
    throw new LifecycleConflictError('Employee is not currently timed in.');
  }
}
