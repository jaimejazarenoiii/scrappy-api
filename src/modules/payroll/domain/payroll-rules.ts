import type { EmployeeEntity } from '../../employee/domain/employee.entity.js';
import type { PayrollRecordEntity } from './payroll-record.entity.js';
import {
  BusinessRuleViolationError,
  DuplicateResourceError,
  LifecycleConflictError,
} from '../../../shared/errors/http-exceptions.js';

export function assertEmployeeHasWeeklySalary(employee: EmployeeEntity): void {
  if (employee.weeklySalary <= 0) {
    throw new BusinessRuleViolationError(
      'Employee must have a weekly salary defined for payroll.',
      [{ employeeId: employee.id }],
    );
  }
}

export function assertNoDuplicatePayPeriod(existing: PayrollRecordEntity | null): void {
  if (existing) {
    throw new DuplicateResourceError(
      'Payroll record already exists for this employee and pay period.',
    );
  }
}

export function assertPayrollIsPayable(record: PayrollRecordEntity): void {
  if (!record.isPayable()) {
    throw new LifecycleConflictError('Payroll record has already been marked as paid.');
  }
}

export function assertNonNegativeNetPay(
  netPay: number,
  employeeId: string,
  grossSalary: number,
  totalDeductions: number,
): void {
  if (netPay < 0) {
    throw new BusinessRuleViolationError('Cash advance deductions exceed gross salary.', [
      { employeeId, grossSalary, totalDeductions },
    ]);
  }
}
