import {
  BusinessRuleViolationError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../shared/errors/http-exceptions.js';
import { isOperationallyReady } from '../../../shared/workforce/operational-readiness.js';
import type { OperationalAttendanceSession } from '../../../shared/workforce/operational-readiness.js';
import type { ExpenseEntity } from './expense.entity.js';
import type { ExpenseContextType } from './expense-context-type.js';
import type { UserRole } from '../../../shared/policy/roles.js';

export interface ExpenseContextFieldsInput {
  contextType: ExpenseContextType;
  branchId?: string | null;
  warehouseId?: string | null;
  vehicleId?: string | null;
  tripId?: string | null;
}

export function assertPositiveAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationAppError('Amount must be greater than zero.', [
      { path: 'amount', message: 'Amount must be greater than zero.' },
    ]);
  }
}

export function assertContextFields(input: ExpenseContextFieldsInput): void {
  const details: Array<{ path: string; message: string }> = [];
  const fkCount = [input.branchId, input.warehouseId, input.vehicleId, input.tripId].filter(
    Boolean,
  ).length;

  if (input.contextType === 'COMPANY') {
    if (fkCount > 0) {
      details.push({
        path: 'contextType',
        message: 'COMPANY context must not include branch, warehouse, vehicle, or trip references.',
      });
    }
  } else if (input.contextType === 'BRANCH') {
    if (!input.branchId) {
      details.push({ path: 'branchId', message: 'branchId is required for BRANCH context.' });
    }
    if (input.warehouseId || input.vehicleId || input.tripId) {
      details.push({
        path: 'contextType',
        message: 'BRANCH context allows only branchId.',
      });
    }
  } else if (input.contextType === 'WAREHOUSE') {
    if (!input.warehouseId) {
      details.push({
        path: 'warehouseId',
        message: 'warehouseId is required for WAREHOUSE context.',
      });
    }
    if (input.branchId || input.vehicleId || input.tripId) {
      details.push({
        path: 'contextType',
        message: 'WAREHOUSE context allows only warehouseId.',
      });
    }
  } else if (input.contextType === 'VEHICLE') {
    if (!input.vehicleId) {
      details.push({ path: 'vehicleId', message: 'vehicleId is required for VEHICLE context.' });
    }
    if (input.branchId || input.warehouseId || input.tripId) {
      details.push({
        path: 'contextType',
        message: 'VEHICLE context allows only vehicleId.',
      });
    }
  } else if (input.contextType === 'TRIP') {
    if (!input.tripId) {
      details.push({ path: 'tripId', message: 'tripId is required for TRIP context.' });
    }
    if (input.branchId || input.warehouseId || input.vehicleId) {
      details.push({
        path: 'contextType',
        message: 'TRIP context allows only tripId.',
      });
    }
  }

  if (details.length > 0) {
    throw new ValidationAppError('Invalid expense context shape.', details);
  }
}

export function assertNotArchived(expense: ExpenseEntity): void {
  if (expense.isArchived()) {
    throw new LifecycleConflictError('Archived expenses cannot be modified.');
  }
}

export function assertEditable(expense: ExpenseEntity, role: UserRole, isOwner: boolean): void {
  assertNotArchived(expense);
  if (expense.isCancelled()) {
    throw new LifecycleConflictError('Cancelled expenses cannot be modified.');
  }
  if (!expense.isEditableBy(role, isOwner)) {
    throw new LifecycleConflictError('This expense cannot be modified in its current state.');
  }
}

export function assertAttachmentsEditable(
  expense: ExpenseEntity,
  role: UserRole,
  isOwner: boolean,
): void {
  assertNotArchived(expense);
  if (expense.isCancelled()) {
    throw new LifecycleConflictError('Cancelled expenses cannot have attachments modified.');
  }
  if (!expense.areAttachmentsEditableBy(role, isOwner)) {
    throw new LifecycleConflictError('Attachments cannot be modified for this expense.');
  }
}

export function assertOperationallyReady(session: OperationalAttendanceSession | null): void {
  if (!isOperationallyReady(session)) {
    throw new BusinessRuleViolationError('Employee must be timed in to create expenses.');
  }
}

export const MAX_EXPENSE_PHOTOS = 20;
