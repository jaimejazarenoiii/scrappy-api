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

describe('organization analytics persistence', () => {
  it('returns per-branch transaction performance', async () => {
    const store = new InMemoryTransactionStore();
    const branchRepo = new InMemoryBranchRepository();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const branch = await branchRepo.create({
      id: randomUUID(),
      companyId,
      name: 'Main Branch',
      address: 'Manila',
      contactNumber: '09170000000',
    });

    await transactionRepo.create({
      id: randomUUID(),
      companyId,
      createdByUserId: randomUUID(),
      direction: 'INBOUND',
      partyName: 'Acme',
      transactionDate: new Date('2026-07-09T10:00:00.000Z'),
      locationType: 'BRANCH',
      branchId: branch.id,
      outsideLocationName: null,
      outsideAddress: null,
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

    const analyticsRepo = new InMemoryAnalyticsQueryRepository(
      store,
      new InMemoryEmployeeRepository(),
      branchRepo,
      new InMemoryWarehouseRepository(),
      new InMemoryVehicleRepository(),
      new InMemoryAttendanceRepository(),
      new InMemoryPayrollRepository(),
      new InMemoryLeaveRepository(),
      new InMemoryCashAdvanceRepository(),
    );

    const metrics = await analyticsRepo.getOrganizationMetrics({
      companyId,
      period: 'CUSTOM',
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.999Z'),
      includeArchived: false,
      rankingLimit: 10,
    });

    expect(metrics.branchPerformance).toHaveLength(1);
    expect(metrics.branchPerformance[0]).toMatchObject({
      branchId: branch.id,
      label: 'Main Branch',
      transactionCount: 1,
      transactionAmount: 1000,
    });
  });
});
