import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { roundMoney } from '../../../src/shared/analytics/analytics-ranking.js';
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

function buildRepository(
  store: InMemoryTransactionStore,
  payrollRepo = new InMemoryPayrollRepository(),
) {
  return {
    analyticsRepo: new InMemoryAnalyticsQueryRepository(
      store,
      new InMemoryEmployeeRepository(),
      new InMemoryBranchRepository(),
      new InMemoryWarehouseRepository(),
      new InMemoryVehicleRepository(),
      new InMemoryAttendanceRepository(),
      payrollRepo,
      new InMemoryLeaveRepository(),
      new InMemoryCashAdvanceRepository(),
    ),
    payrollRepo,
  };
}

describe('company metrics', () => {
  it('computes net operational amount as sales minus purchases minus payroll minus expenses', async () => {
    const store = new InMemoryTransactionStore();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const { analyticsRepo, payrollRepo } = buildRepository(store);
    const companyId = randomUUID();
    const employeeId = randomUUID();

    await transactionRepo.create({
      id: randomUUID(),
      companyId,
      createdByUserId: randomUUID(),
      direction: 'INBOUND',
      partyName: 'Acme',
      transactionDate: new Date('2026-07-09T10:00:00.000Z'),
      locationType: 'OUTSIDE',
      outsideLocationName: 'Road',
      outsideAddress: '123 Lane',
      assignedEmployeeIds: [employeeId],
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

    await payrollRepo.create({
      id: randomUUID(),
      companyId,
      employeeId,
      payPeriodStart: new Date('2026-07-01T00:00:00.000Z'),
      payPeriodEnd: new Date('2026-07-07T23:59:59.999Z'),
      grossSalary: 4000,
      cashAdvanceDeductions: 0,
      netPay: 3500,
    });

    const metrics = await analyticsRepo.getCompanyMetrics({
      companyId,
      period: 'CUSTOM',
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.999Z'),
      includeArchived: false,
      rankingLimit: 10,
    });

    expect(metrics.totalTransactionAmount).toBe(1000);
    expect(metrics.inboundAmount).toBe(1000);
    expect(metrics.outboundAmount).toBe(0);
    expect(metrics.totalPayroll).toBe(3500);
    expect(metrics.totalExpenses).toBe(0);
    // INBOUND buys scrap (cash out), so net = outbound - inbound - expenses - payroll.
    expect(metrics.netOperationalAmount).toBe(roundMoney(0 - 1000 - 0 - 3500));
  });
});
