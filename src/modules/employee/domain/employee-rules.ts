import {
  CompanyScopeViolationError,
  LifecycleConflictError,
} from '../../../shared/errors/http-exceptions.js';
import type { EmployeeEntity } from './employee.entity.js';

export function assertEmployeeActive(employee: EmployeeEntity): void {
  if (!employee.isActive()) {
    throw new LifecycleConflictError('Inactive or deleted employee cannot perform this action');
  }
}

export function assertSameCompany(companyIdA: string, companyIdB: string): void {
  if (companyIdA != companyIdB) {
    throw new CompanyScopeViolationError('Employee and user must belong to the same company');
  }
}

export function assertEmployeeHasNoUser(employee: EmployeeEntity): void {
  if (employee.isLinkedToUser()) {
    throw new LifecycleConflictError('Employee already has a linked user account');
  }
}

export function assertEmployeeHasUser(employee: EmployeeEntity): void {
  if (!employee.isLinkedToUser()) {
    throw new LifecycleConflictError('Employee does not have a linked user account');
  }
}
