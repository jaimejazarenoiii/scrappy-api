import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { UpdateTransactionUseCase } from '../../../src/modules/transaction/application/use-cases/update-transaction.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import {
  ForbiddenError,
  LifecycleConflictError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryBranchRepository,
  InMemoryEmployeeRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
  InMemoryWarehouseRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

async function buildFixture() {
  const companyId = randomUUID();
  const userRepository = new InMemoryUserRepository();
  const employeeRepository = new InMemoryEmployeeRepository();
  const branchRepository = new InMemoryBranchRepository();
  const warehouseRepository = new InMemoryWarehouseRepository();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);

  const assignedEmployeeId = randomUUID();
  await employeeRepository.create({
    id: assignedEmployeeId,
    companyId,
    firstName: 'Jane',
    lastName: 'Worker',
    weeklySalary: 3500,
  });

  const detail = await transactionRepository.create({
    id: randomUUID(),
    companyId,
    createdByUserId: randomUUID(),
    direction: 'INBOUND',
    partyName: 'Acme',
    transactionDate: new Date(),
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [assignedEmployeeId],
    items: [],
  });

  const useCase = new UpdateTransactionUseCase(
    transactionRepository,
    userRepository,
    employeeRepository,
    branchRepository,
    warehouseRepository,
  );

  return {
    companyId,
    assignedEmployeeId,
    transactionId: detail.transaction.id,
    userRepository,
    employeeRepository,
    transactionRepository,
    store,
    useCase,
  };
}

const managerAuth = (companyId: string): AuthorizationContext => ({
  companyId,
  userId: randomUUID(),
  role: 'MANAGER',
});

describe('UpdateTransactionUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('applies partial updates while keeping draft status', async () => {
    const f = await buildFixture();
    const result = await f.useCase.execute(f.transactionId, managerAuth(f.companyId), {
      partyName: 'New Party',
      notes: 'auto-saved',
    });
    expect(result.partyName).toBe('New Party');
    expect(result.notes).toBe('auto-saved');
    expect(result.status).toBe('DRAFT');
  });

  it('rejects edits to a cancelled transaction', async () => {
    const f = await buildFixture();
    await f.transactionRepository.cancel(f.transactionId, f.companyId, {});
    await expect(
      f.useCase.execute(f.transactionId, managerAuth(f.companyId), { partyName: 'X' }),
    ).rejects.toThrow(LifecycleConflictError);
  });

  it('rejects an unassigned employee', async () => {
    const f = await buildFixture();
    const userId = randomUUID();
    const otherEmployeeId = randomUUID();
    await f.employeeRepository.create({
      id: otherEmployeeId,
      companyId: f.companyId,
      firstName: 'Not',
      lastName: 'Assigned',
      weeklySalary: 100,
    });
    await f.userRepository.create({
      id: userId,
      companyId: f.companyId,
      email: 'other@scrappy.test',
      passwordHash: 'hashed',
      role: 'EMPLOYEE',
    });
    await f.userRepository.linkEmployee(userId, otherEmployeeId);

    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId, role: 'EMPLOYEE' },
        { partyName: 'X' },
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('allows an assigned employee to edit', async () => {
    const f = await buildFixture();
    const userId = randomUUID();
    await f.userRepository.create({
      id: userId,
      companyId: f.companyId,
      email: 'assigned@scrappy.test',
      passwordHash: 'hashed',
      role: 'EMPLOYEE',
    });
    await f.userRepository.linkEmployee(userId, f.assignedEmployeeId);

    const result = await f.useCase.execute(
      f.transactionId,
      { companyId: f.companyId, userId, role: 'EMPLOYEE' },
      { partyName: 'Edited by assignee' },
    );
    expect(result.partyName).toBe('Edited by assignee');
  });
});
