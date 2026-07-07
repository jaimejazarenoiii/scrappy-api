import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';

function createInput(companyId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    companyId,
    createdByUserId: randomUUID(),
    direction: 'INBOUND' as const,
    partyName: 'Acme',
    transactionDate: new Date(),
    locationType: 'OUTSIDE' as const,
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: ['emp-1', 'emp-2'],
    items: [
      {
        id: randomUUID(),
        materialName: 'Copper',
        weight: 10,
        unit: 'KG' as const,
        price: 250,
        total: 2500,
      },
    ],
    ...overrides,
  };
}

describe('transaction create persistence', () => {
  it('persists a transaction with items and assignments', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();

    const detail = await repo.create(createInput(companyId));

    expect(detail.items).toHaveLength(1);
    expect(detail.assignments.map((a) => a.employeeId)).toEqual(['emp-1', 'emp-2']);

    const found = await repo.findDetailById(detail.transaction.id, companyId);
    expect(found).not.toBeNull();
    expect(found!.transaction.isDraft()).toBe(true);
  });

  it('scopes retrieval by company', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const detail = await repo.create(createInput(companyId));

    expect(await repo.findById(detail.transaction.id, companyId)).not.toBeNull();
    expect(await repo.findById(detail.transaction.id, randomUUID())).toBeNull();
  });

  it('records employee assignment for assignment checks', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const detail = await repo.create(createInput(companyId));

    expect(await repo.isEmployeeAssigned(detail.transaction.id, 'emp-1')).toBe(true);
    expect(await repo.isEmployeeAssigned(detail.transaction.id, 'emp-unknown')).toBe(false);
  });
});
