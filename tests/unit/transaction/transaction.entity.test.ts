import { describe, expect, it } from 'vitest';
import { TransactionEntity } from '../../../src/modules/transaction/domain/transaction.entity.js';
import {
  toCanonicalDirection,
  toDirectionLabel,
} from '../../../src/shared/transactions/direction-mapper.js';
import { computeItemTotal } from '../../../src/shared/transactions/item-total.js';

function buildEntity(overrides: Partial<Parameters<typeof TransactionEntity.create>[0]> = {}) {
  const now = new Date();
  return TransactionEntity.create({
    id: 't1',
    companyId: 'c1',
    createdByUserId: 'u1',
    updatedByUserId: null,
    transactionNumber: 'IN-20260708-000001',
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
    submittedAt: null,
    submittedByUserId: null,
    paidAt: null,
    paidByUserId: null,
    cancellationReason: null,
    cancelledAt: null,
    cancelledByUserId: null,
    reopenedAt: null,
    reopenedByUserId: null,
    reopenReason: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });
}

describe('TransactionEntity', () => {
  it('reports draft status and location helpers', () => {
    const entity = buildEntity();
    expect(entity.isDraft()).toBe(true);
    expect(entity.isCancelled()).toBe(false);
    expect(entity.isArchived()).toBe(false);
    expect(entity.isOutside()).toBe(true);
    expect(entity.isAtBranch()).toBe(false);
    expect(entity.belongsToCompany('c1')).toBe(true);
    expect(entity.belongsToCompany('other')).toBe(false);
  });

  it('detects cancelled and archived states', () => {
    expect(buildEntity({ status: 'CANCELLED' }).isCancelled()).toBe(true);
    expect(buildEntity({ deletedAt: new Date() }).isArchived()).toBe(true);
  });

  it('recognizes branch and warehouse locations', () => {
    expect(buildEntity({ locationType: 'BRANCH', branchId: 'b1' }).isAtBranch()).toBe(true);
    expect(buildEntity({ locationType: 'WAREHOUSE', warehouseId: 'w1' }).isAtWarehouse()).toBe(
      true,
    );
  });

  it('exposes an immutable primitives copy', () => {
    const entity = buildEntity();
    const primitives = entity.toPrimitives();
    primitives.partyName = 'Mutated';
    expect(entity.toPrimitives().partyName).toBe('Acme');
  });
});

describe('direction mapper', () => {
  it('maps UI labels to canonical directions', () => {
    expect(toCanonicalDirection('BUY')).toBe('INBOUND');
    expect(toCanonicalDirection('SELL')).toBe('OUTBOUND');
    expect(toCanonicalDirection('INBOUND')).toBe('INBOUND');
    expect(toCanonicalDirection('OUTBOUND')).toBe('OUTBOUND');
  });

  it('maps canonical directions to labels', () => {
    expect(toDirectionLabel('INBOUND')).toBe('BUY');
    expect(toDirectionLabel('OUTBOUND')).toBe('SELL');
  });
});

describe('computeItemTotal', () => {
  it('rounds to two decimal places', () => {
    expect(computeItemTotal(10, 250)).toBe(2500);
    expect(computeItemTotal(1.005, 100)).toBe(100.5);
    expect(computeItemTotal(3.333, 3)).toBe(10);
  });

  it('handles fractional cents without floating point drift', () => {
    expect(computeItemTotal(0.1, 0.2)).toBe(0.02);
  });
});
