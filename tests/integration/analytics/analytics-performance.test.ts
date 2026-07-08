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

describe('analytics performance', () => {
  it('aggregates a moderately large in-memory dataset within a soft threshold', async () => {
    const store = new InMemoryTransactionStore();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const filter = {
      companyId,
      period: 'CUSTOM' as const,
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-12-31T23:59:59.999Z'),
      includeArchived: false,
      rankingLimit: 10,
    };

    for (let index = 0; index < 200; index += 1) {
      await transactionRepo.create({
        id: randomUUID(),
        companyId,
        createdByUserId: randomUUID(),
        direction: index % 2 === 0 ? 'INBOUND' : 'OUTBOUND',
        partyName: `Party ${index}`,
        transactionDate: new Date(
          `2026-07-${String((index % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
        ),
        locationType: 'OUTSIDE',
        outsideLocationName: 'Road',
        outsideAddress: '123 Lane',
        assignedEmployeeIds: [],
        items: [
          {
            id: randomUUID(),
            materialName: `Material ${index % 10}`,
            weight: 1,
            unit: 'KG',
            price: 10,
            total: 10,
          },
        ],
      });
    }

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

    const started = performance.now();
    const metrics = await analyticsRepo.getTransactionMetrics(filter);
    const elapsedMs = performance.now() - started;

    expect(metrics.transactionCount).toBe(200);
    expect(elapsedMs).toBeLessThan(1000);
  });
});
