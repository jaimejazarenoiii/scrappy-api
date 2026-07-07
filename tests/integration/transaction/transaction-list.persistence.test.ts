import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';

function seed(companyId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    companyId,
    createdByUserId: randomUUID(),
    direction: 'INBOUND' as const,
    partyName: 'Acme Metals',
    transactionDate: new Date('2026-01-01T00:00:00Z'),
    locationType: 'OUTSIDE' as const,
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [] as string[],
    items: [
      {
        id: randomUUID(),
        materialName: 'Copper',
        weight: 5,
        unit: 'KG' as const,
        price: 100,
        total: 500,
      },
    ],
    ...overrides,
  };
}

describe('transaction list persistence', () => {
  it('filters by direction, status, location, date range, and search', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const branchId = randomUUID();

    await repo.create(seed(companyId, { direction: 'INBOUND', partyName: 'Copper King' }));
    await repo.create(
      seed(companyId, {
        direction: 'OUTBOUND',
        locationType: 'BRANCH',
        branchId,
        outsideLocationName: null,
        outsideAddress: null,
        transactionDate: new Date('2026-06-01T00:00:00Z'),
      }),
    );

    const byDirection = await repo.listByCompany(companyId, {
      page: 1,
      limit: 20,
      direction: 'OUTBOUND',
    });
    expect(byDirection.total).toBe(1);

    const byLocation = await repo.listByCompany(companyId, {
      page: 1,
      limit: 20,
      locationType: 'BRANCH',
    });
    expect(byLocation.total).toBe(1);

    const byDate = await repo.listByCompany(companyId, {
      page: 1,
      limit: 20,
      fromDate: new Date('2026-05-01T00:00:00Z'),
    });
    expect(byDate.total).toBe(1);

    const bySearch = await repo.listByCompany(companyId, {
      page: 1,
      limit: 20,
      search: 'king',
    });
    expect(bySearch.total).toBe(1);
  });

  it('scopes assigned listing to the employee', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const employeeId = randomUUID();

    await repo.create(seed(companyId, { assignedEmployeeIds: [employeeId] }));
    await repo.create(seed(companyId, { assignedEmployeeIds: [randomUUID()] }));

    const assigned = await repo.listAssigned(companyId, employeeId, { page: 1, limit: 20 });
    expect(assigned.total).toBe(1);
  });

  it('excludes archived transactions unless includeArchived is set', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const detail = await repo.create(seed(companyId));
    await repo.archive(detail.transaction.id, companyId);

    const defaultList = await repo.listByCompany(companyId, { page: 1, limit: 20 });
    expect(defaultList.total).toBe(0);

    const withArchived = await repo.listByCompany(companyId, {
      page: 1,
      limit: 20,
      includeArchived: true,
    });
    expect(withArchived.total).toBe(1);
  });

  it('computes summary totals and item counts', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    await repo.create(seed(companyId));

    const list = await repo.listByCompany(companyId, { page: 1, limit: 20 });
    expect(list.items[0]!.itemCount).toBe(1);
    expect(list.items[0]!.totalAmount).toBe(500);
  });
});
