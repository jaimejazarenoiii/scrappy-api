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

describe('company analytics persistence', () => {
  it('aggregates live employee and vehicle counts', async () => {
    const store = new InMemoryTransactionStore();
    const employeeRepo = new InMemoryEmployeeRepository();
    const vehicleRepo = new InMemoryVehicleRepository();
    const companyId = randomUUID();

    await employeeRepo.create({
      id: randomUUID(),
      companyId,
      firstName: 'Jane',
      lastName: 'Worker',
      weeklySalary: 3500,
      status: 'ACTIVE',
    });
    await vehicleRepo.create({
      id: randomUUID(),
      companyId,
      plateNumber: 'ABC-1234',
      description: 'Delivery van',
      status: 'AVAILABLE',
    });

    const analyticsRepo = new InMemoryAnalyticsQueryRepository(
      store,
      employeeRepo,
      new InMemoryBranchRepository(),
      new InMemoryWarehouseRepository(),
      vehicleRepo,
      new InMemoryAttendanceRepository(),
      new InMemoryPayrollRepository(),
      new InMemoryLeaveRepository(),
      new InMemoryCashAdvanceRepository(),
    );

    const metrics = await analyticsRepo.getCompanyMetrics({
      companyId,
      period: 'THIS_MONTH',
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.999Z'),
      includeArchived: false,
      rankingLimit: 10,
    });

    expect(metrics.activeEmployees).toBe(1);
    expect(metrics.activeVehicles).toBe(1);
  });
});
