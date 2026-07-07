import { describe, expect, it } from 'vitest';
import {
  assertDraftEditable,
  assertItemTotal,
  assertLocationFields,
  assertNotArchived,
  assertOperationallyReady,
} from '../../../src/modules/transaction/domain/transaction-rules.js';
import { TransactionEntity } from '../../../src/modules/transaction/domain/transaction.entity.js';
import {
  BusinessRuleViolationError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../src/shared/errors/http-exceptions.js';

function buildEntity(overrides: Partial<Parameters<typeof TransactionEntity.create>[0]> = {}) {
  const now = new Date();
  return TransactionEntity.create({
    id: 't1',
    companyId: 'c1',
    createdByUserId: 'u1',
    updatedByUserId: null,
    direction: 'INBOUND',
    status: 'DRAFT',
    partyName: 'Acme',
    partyContactNumber: null,
    transactionDate: now,
    locationType: 'OUTSIDE',
    branchId: null,
    warehouseId: null,
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    tripId: null,
    notes: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });
}

describe('assertOperationallyReady', () => {
  it('passes when an open session exists', () => {
    expect(() => assertOperationallyReady({ status: 'OPEN', timeOutAt: null })).not.toThrow();
  });

  it('throws when not timed in', () => {
    expect(() => assertOperationallyReady(null)).toThrow(BusinessRuleViolationError);
  });
});

describe('assertLocationFields', () => {
  it('requires branchId for BRANCH transactions', () => {
    expect(() => assertLocationFields({ locationType: 'BRANCH' })).toThrow(ValidationAppError);
    expect(() => assertLocationFields({ locationType: 'BRANCH', branchId: 'b1' })).not.toThrow();
  });

  it('requires warehouseId for WAREHOUSE transactions', () => {
    expect(() => assertLocationFields({ locationType: 'WAREHOUSE' })).toThrow(ValidationAppError);
    expect(() =>
      assertLocationFields({ locationType: 'WAREHOUSE', warehouseId: 'w1' }),
    ).not.toThrow();
  });

  it('requires name and address for OUTSIDE transactions', () => {
    expect(() =>
      assertLocationFields({ locationType: 'OUTSIDE', outsideLocationName: 'Roadside' }),
    ).toThrow(ValidationAppError);
    expect(() =>
      assertLocationFields({
        locationType: 'OUTSIDE',
        outsideLocationName: 'Roadside',
        outsideAddress: '123 Lane',
      }),
    ).not.toThrow();
  });
});

describe('assertItemTotal', () => {
  it('accepts a matching provided total', () => {
    expect(() => assertItemTotal(10, 250, 2500)).not.toThrow();
  });

  it('skips validation when no total is provided', () => {
    expect(() => assertItemTotal(10, 250)).not.toThrow();
  });

  it('rejects a mismatched total', () => {
    expect(() => assertItemTotal(10, 250, 9999)).toThrow(BusinessRuleViolationError);
  });
});

describe('draft and archive assertions', () => {
  it('allows editing drafts and blocks cancelled transactions', () => {
    expect(() => assertDraftEditable(buildEntity())).not.toThrow();
    expect(() => assertDraftEditable(buildEntity({ status: 'CANCELLED' }))).toThrow(
      LifecycleConflictError,
    );
  });

  it('blocks modifications to archived transactions', () => {
    expect(() => assertNotArchived(buildEntity())).not.toThrow();
    expect(() => assertNotArchived(buildEntity({ deletedAt: new Date() }))).toThrow(
      LifecycleConflictError,
    );
  });
});
