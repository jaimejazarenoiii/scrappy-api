import type { LeaveRecordEntity } from './leave-record.entity.js';
import type { EmployeeEntity } from '../../employee/domain/employee.entity.js';
import { LifecycleConflictError } from '../../../shared/errors/http-exceptions.js';

export function assertEmployeeCanRequestLeave(employee: EmployeeEntity): void {
  if (!employee.isActive()) {
    throw new LifecycleConflictError('Archived or inactive employees cannot request leave.');
  }
}

export function assertNoOverlappingLeave(existing: LeaveRecordEntity | null): void {
  if (existing) {
    throw new LifecycleConflictError('Leave already exists for this date.');
  }
}
