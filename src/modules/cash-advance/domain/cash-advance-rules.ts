import type { EmployeeEntity } from '../../employee/domain/employee.entity.js';
import { assertEmployeeActive } from '../../employee/domain/employee-rules.js';
import {
  BusinessRuleViolationError,
  CompanyScopeViolationError,
} from '../../../shared/errors/http-exceptions.js';
import type { CashAdvanceEntity } from './cash-advance.entity.js';

export function assertEmployeeBelongsToCompany(employee: EmployeeEntity, companyId: string): void {
  if (!employee.belongsToCompany(companyId)) {
    throw new CompanyScopeViolationError('Employee does not belong to this company.');
  }
}

export function assertEmployeeEligibleForAdvance(employee: EmployeeEntity): void {
  assertEmployeeActive(employee);
}

export function assertPositiveAdvanceAmount(amount: number): void {
  if (amount <= 0) {
    throw new BusinessRuleViolationError('Cash advance amount must be positive.');
  }
}

export function assertBalancedAmounts(advance: CashAdvanceEntity): void {
  if (!advance.hasBalancedAmounts()) {
    throw new BusinessRuleViolationError(
      'Cash advance deducted and remaining amounts must equal the original amount.',
    );
  }
}
