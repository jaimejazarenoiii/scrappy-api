import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryAttendanceRepository,
  InMemoryBranchRepository,
  InMemoryCashAdvanceRepository,
  InMemoryEmployeeRepository,
  InMemoryLeaveRepository,
  InMemoryPayrollRepository,
  InMemoryTransactionStore,
  InMemoryVehicleRepository,
  InMemoryWarehouseRepository,
} from '../../setup/in-memory-repositories.js';
import { InMemoryAnalyticsQueryRepository } from '../../setup/in-memory-analytics-query-repository.js';

describe('trip analytics persistence', () => {
  it('returns zero trip metrics until trip data is available', async () => {
    const analyticsRepo = new InMemoryAnalyticsQueryRepository(
      new InMemoryTransactionStore(),
      new InMemoryEmployeeRepository(),
      new InMemoryBranchRepository(),
      new InMemoryWarehouseRepository(),
      new InMemoryVehicleRepository(),
      new InMemoryAttendanceRepository(),
      new InMemoryPayrollRepository(),
      new InMemoryLeaveRepository(),
      new InMemoryCashAdvanceRepository(),
    );

    const metrics = await analyticsRepo.getTripMetrics({
      companyId: randomUUID(),
      period: 'THIS_MONTH',
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.999Z'),
      includeArchived: false,
      rankingLimit: 10,
    });

    expect(metrics.totalTrips).toBe(0);
    expect(metrics.vehicleUtilization).toEqual([]);
  });
});
