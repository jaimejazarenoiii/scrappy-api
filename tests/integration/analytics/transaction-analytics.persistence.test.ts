import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryAttendanceRepository,
  InMemoryBranchRepository,
  InMemoryCashAdvanceRepository,
  InMemoryEmployeeRepository,
  InMemoryLeaveRepository,
  InMemoryPayrollRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryVehicleRepository,
  InMemoryWarehouseRepository,
} from '../../setup/in-memory-repositories.js';
import { InMemoryAnalyticsQueryRepository } from '../../setup/in-memory-analytics-query-repository.js';

describe('transaction analytics persistence', () => {
  it('aggregates item totals across transactions', async () => {
    const store = new InMemoryTransactionStore();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const filter = {
      companyId,
      period: 'CUSTOM' as const,
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.999Z'),
      includeArchived: false,
      rankingLimit: 10,
    };

    await transactionRepo.create({
      id: randomUUID(),
      companyId,
      createdByUserId: randomUUID(),
      direction: 'INBOUND',
      partyName: 'One',
      transactionDate: new Date('2026-07-09T10:00:00.000Z'),
      locationType: 'OUTSIDE',
      outsideLocationName: 'Road',
      outsideAddress: '123 Lane',
      assignedEmployeeIds: [],
      items: [
        {
          id: randomUUID(),
          materialName: 'Copper',
          weight: 10,
          unit: 'KG',
          price: 100,
          total: 1000,
        },
      ],
    });
    await transactionRepo.create({
      id: randomUUID(),
      companyId,
      createdByUserId: randomUUID(),
      direction: 'INBOUND',
      partyName: 'Two',
      transactionDate: new Date('2026-07-09T11:00:00.000Z'),
      locationType: 'OUTSIDE',
      outsideLocationName: 'Road',
      outsideAddress: '123 Lane',
      assignedEmployeeIds: [],
      items: [
        {
          id: randomUUID(),
          materialName: 'Copper',
          weight: 5,
          unit: 'KG',
          price: 100,
          total: 500,
        },
      ],
    });

    const analyticsRepo = new InMemoryAnalyticsQueryRepository(
      store,
      new InMemoryEmployeeRepository(),
      new InMemoryBranchRepository(),
      new InMemoryWarehouseRepository(),
      new InMemoryVehicleRepository(),
      new InMemoryAttendanceRepository(),
      new InMemoryPayrollRepository(),
      new InMemoryLeaveRepository(),
      new InMemoryCashAdvanceRepository(),
    );

    const metrics = await analyticsRepo.getTransactionMetrics(filter);
    expect(metrics.transactionCount).toBe(2);
    expect(metrics.totalTransactionAmount).toBe(1500);
    expect(metrics.topMaterials[0]).toMatchObject({ label: 'Copper', value: 1500, rank: 1 });
  });
});
