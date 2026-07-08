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

describe('workforce analytics persistence', () => {
  it('aggregates attendance sessions in range', async () => {
    const attendanceRepo = new InMemoryAttendanceRepository();
    const companyId = randomUUID();
    const employeeId = randomUUID();
    const timeInAt = new Date('2026-07-09T08:00:00.000Z');
    const timeOutAt = new Date('2026-07-09T12:00:00.000Z');

    const session = await attendanceRepo.create({
      id: randomUUID(),
      companyId,
      employeeId,
      timeInAt,
    });
    await attendanceRepo.close(session.id, companyId, timeOutAt);

    const analyticsRepo = new InMemoryAnalyticsQueryRepository(
      new InMemoryTransactionStore(),
      new InMemoryEmployeeRepository(),
      new InMemoryBranchRepository(),
      new InMemoryWarehouseRepository(),
      new InMemoryVehicleRepository(),
      attendanceRepo,
      new InMemoryPayrollRepository(),
      new InMemoryLeaveRepository(),
      new InMemoryCashAdvanceRepository(),
    );

    const metrics = await analyticsRepo.getWorkforceMetrics({
      companyId,
      period: 'CUSTOM',
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.999Z'),
      includeArchived: false,
      rankingLimit: 10,
    });

    expect(metrics.attendanceSummary.sessionsCount).toBe(1);
    expect(metrics.attendanceSummary.totalHours).toBe(4);
  });
});
