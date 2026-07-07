import {
  BusinessRuleViolationError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../shared/errors/http-exceptions.js';
import { isOperationallyReady } from '../../../shared/workforce/operational-readiness.js';
import type { OperationalAttendanceSession } from '../../../shared/workforce/operational-readiness.js';
import { computeItemTotal } from '../../../shared/transactions/item-total.js';
import type { TransactionEntity } from './transaction.entity.js';
import type { TransactionLocationType } from './transaction-location-type.js';

export interface LocationFieldsInput {
  locationType: TransactionLocationType;
  branchId?: string | null;
  warehouseId?: string | null;
  outsideLocationName?: string | null;
  outsideAddress?: string | null;
}

/**
 * Ensures a transaction is a Draft (editable). Cancelled transactions are immutable.
 */
export function assertDraftEditable(transaction: TransactionEntity): void {
  if (!transaction.isDraft()) {
    throw new LifecycleConflictError('Only draft transactions can be modified.');
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
  } else {
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
