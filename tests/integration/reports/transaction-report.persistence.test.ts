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
  InMemoryUserRepository,
  InMemoryVehicleRepository,
  InMemoryWarehouseRepository,
} from '../../setup/in-memory-repositories.js';
import { InMemoryReportsQueryRepository } from '../../setup/in-memory-reports-query-repository.js';

describe('transaction report persistence', () => {
  it('lists and counts transactions with rounded totals', async () => {
    const store = new InMemoryTransactionStore();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const employeeRepository = new InMemoryEmployeeRepository();
    const userRepository = new InMemoryUserRepository();
    const companyId = randomUUID();
    const createdByUserId = randomUUID();
    const employeeId = randomUUID();

    await userRepository.create({
      id: createdByUserId,
      companyId,
      email: 'owner@scrappy.test',
      passwordHash: 'hash',
      role: 'OWNER',
    });
    await employeeRepository.create({
      id: employeeId,
      companyId,
      firstName: 'Jane',
      lastName: 'Doe',
      weeklySalary: 1000,
    });

    await transactionRepo.create({
      id: randomUUID(),
      companyId,
      createdByUserId,
      direction: 'INBOUND',
      partyName: 'Copper Buyer',
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
          price: 100.555,
          total: 1005.55,
        },
      ],
    });

    const reportsRepo = new InMemoryReportsQueryRepository(
      store,
      employeeRepository,
      new InMemoryBranchRepository(),
      new InMemoryWarehouseRepository(),
      new InMemoryVehicleRepository(),
      new InMemoryAttendanceRepository(),
      new InMemoryPayrollRepository(),
      new InMemoryLeaveRepository(),
      new InMemoryCashAdvanceRepository(),
      userRepository,
    );

    const filter = {
      companyId,
      from: new Date('2026-07-01T00:00:00.000Z'),
      to: new Date('2026-07-31T23:59:59.999Z'),
      includeArchived: false,
    };
    const sort = { sortBy: 'transactionDate', sortOrder: 'desc' as const };
    const pagination = { page: 1, limit: 20 };

    const list = await reportsRepo.listTransactionReports({ filter, sort, pagination });
    expect(list.total).toBe(1);
    expect(list.items[0]).toMatchObject({
      partyName: 'Copper Buyer',
      grandTotal: 1005.55,
      assignedEmployees: ['Jane Doe'],
      createdBy: 'owner@scrappy.test',
    });

    const count = await reportsRepo.countTransactionReports({ filter, sort });
    expect(count).toBe(1);

    const batch = await reportsRepo.batchTransactionReports({ filter, sort }, 0, 10);
    expect(batch).toHaveLength(1);
    expect(batch[0].items[0].price).toBe(100.56);
  });
});
