import {
  BusinessRuleViolationError,
  ForbiddenError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../shared/errors/http-exceptions.js';
import { isOperationallyReady } from '../../../shared/workforce/operational-readiness.js';
import type { OperationalAttendanceSession } from '../../../shared/workforce/operational-readiness.js';
import { computeItemTotal } from '../../../shared/transactions/item-total.js';
import type { TransactionEntity } from './transaction.entity.js';
import type { TransactionLocationType } from './transaction-location-type.js';
import type { UserRole } from '../../../shared/policy/roles.js';
import { assertTransition, type TransactionAction } from './transaction-lifecycle.js';

export interface LocationFieldsInput {
  locationType: TransactionLocationType;
  branchId?: string | null;
  warehouseId?: string | null;
  outsideLocationName?: string | null;
  outsideAddress?: string | null;
  tripId?: string | null;
}

/**
 * Ensures a transaction is a Draft (editable). Cancelled transactions are immutable.
 */
export function assertDraftEditable(transaction: TransactionEntity): void {
  if (!transaction.isDraft()) {
    throw new LifecycleConflictError('Only draft transactions can be modified.');
  }
}

export function assertEditable(
  transaction: TransactionEntity,
  role: UserRole,
  isAssigned: boolean,
): void {
  assertNotArchived(transaction);
  if (transaction.isCancelled()) {
    throw new LifecycleConflictError('Cancelled transactions cannot be modified.');
  }
  if (transaction.isPaid()) {
    throw new LifecycleConflictError('Paid transactions cannot be modified.');
  }
  if (!transaction.isEditableBy(role, isAssigned)) {
    throw new ForbiddenError('You do not have permission to modify this transaction.');
  }
}

/**
 * Ensures a transaction has not been archived (soft deleted).
 */
export function assertNotArchived(transaction: TransactionEntity): void {
  if (transaction.isArchived()) {
    throw new LifecycleConflictError('Archived transactions cannot be modified.');
  }
}

/**
 * Validates that the location fields provided are consistent with the selected location type.
 */
export function assertLocationFields(input: LocationFieldsInput): void {
  const details: Record<string, unknown>[] = [];
  if (input.locationType === 'BRANCH') {
    if (!input.branchId) {
      details.push({ path: 'branchId', message: 'branchId is required for BRANCH transactions.' });
    }
  } else if (input.locationType === 'WAREHOUSE') {
    if (!input.warehouseId) {
      details.push({
        path: 'warehouseId',
        message: 'warehouseId is required for WAREHOUSE transactions.',
      });
    }
  } else if (input.locationType === 'OUTSIDE') {
    if (!input.outsideLocationName) {
      details.push({
        path: 'outsideLocationName',
        message: 'outsideLocationName is required for OUTSIDE transactions.',
      });
    }
    if (!input.outsideAddress) {
      details.push({
        path: 'outsideAddress',
        message: 'outsideAddress is required for OUTSIDE transactions.',
      });
    }
  } else if (input.locationType === 'TRIP') {
    if (!input.tripId) {
      details.push({ path: 'tripId', message: 'tripId is required for TRIP transactions.' });
    }
  }
  if (details.length > 0) {
    throw new ValidationAppError('Invalid location fields for transaction.', details);
  }
}

/**
 * Ensures the acting employee is operationally ready (timed in) before creating a transaction.
 */
export function assertOperationallyReady(session: OperationalAttendanceSession | null): void {
  if (!isOperationallyReady(session)) {
    throw new BusinessRuleViolationError('You must be timed in before creating a transaction.');
  }
}

export function assertHasItems(itemCount: number): void {
  if (itemCount < 1) {
    throw new ValidationAppError('At least one item is required before submission.', [
      { path: 'items', message: 'At least one item is required before submission.' },
    ]);
  }
}

export function assertPositiveGrandTotal(totalAmount: number): void {
  if (totalAmount <= 0) {
    throw new BusinessRuleViolationError(
      'Transaction total must be greater than zero before submission.',
      [{ path: 'totalAmount', message: 'Transaction total must be greater than zero.' }],
    );
  }
}

export function assertReadyForPayment(transaction: TransactionEntity, role: UserRole): void {
  assertNotArchived(transaction);
  assertTransition(transaction.status, 'settle', role);
}

export function assertPaid(transaction: TransactionEntity, role: UserRole): void {
  assertNotArchived(transaction);
  assertTransition(transaction.status, 'reopen', role);
}

export function assertStatusTransition(
  transaction: TransactionEntity,
  action: TransactionAction,
  role: UserRole,
): void {
  assertNotArchived(transaction);
  assertTransition(transaction.status, action, role);
}

export function assertFinishable(
  transaction: TransactionEntity,
  itemCount: number,
  totalAmount: number,
  role: UserRole,
): void {
  assertStatusTransition(transaction, 'finish', role);
  assertLocationFields(transaction.toPrimitives());
  assertHasItems(itemCount);
  assertPositiveGrandTotal(totalAmount);
}

/**
 * Validates that a client-supplied total matches the server-computed `weight * price` total.
 */
export function assertItemTotal(weight: number, price: number, providedTotal?: number): void {
  if (providedTotal === undefined) return;
  const expected = computeItemTotal(weight, price);
  if (Math.abs(expected - providedTotal) > 0.001) {
    throw new BusinessRuleViolationError('Item total does not match weight multiplied by price.', [
      { path: 'total', message: `Expected ${expected} for the provided weight and price.` },
    ]);
  }
}
