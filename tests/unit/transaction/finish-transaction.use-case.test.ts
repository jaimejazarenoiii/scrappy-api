import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { FinishTransactionUseCase } from '../../../src/modules/transaction/application/use-cases/finish-transaction.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  ForbiddenError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryTransactionItemRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

async function buildFixture() {
  const companyId = randomUUID();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const itemRepository = new InMemoryTransactionItemRepository(store);
  const userRepository = new InMemoryUserRepository();

  const employeeId = randomUUID();
  const userId = randomUUID();
  await userRepository.create({
    id: userId,
    companyId,
    email: 'finish-worker@scrappy.test',
    passwordHash: 'hashed',
    role: 'EMPLOYEE',
  });
  await userRepository.linkEmployee(userId, employeeId);

  const detail = await transactionRepository.create({
    id: randomUUID(),
    companyId,
    createdByUserId: userId,
    transactionNumber: 'IN-20260708-000001',
    direction: 'INBOUND',
    partyName: 'Acme',
    transactionDate: new Date(),
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [employeeId],
    items: [
      {
        id: randomUUID(),
        materialName: 'Copper',
        weight: 10,
        unit: 'KG',
        price: 250,
        total: 2500,
      },
    ],
  });

  const auth: AuthorizationContext = { companyId, userId, role: 'EMPLOYEE' };
  return {
    companyId,
    employeeId,
    userId,
    transactionId: detail.transaction.id,
    transactionRepository,
    itemRepository,
    userRepository,
    auth,
    useCase: new FinishTransactionUseCase(transactionRepository, userRepository),
  };
}

describe('FinishTransactionUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('submits a complete assigned draft to ready for payment', async () => {
    const f = await buildFixture();
    const result = await f.useCase.execute(f.transactionId, f.auth);
    expect(result.status).toBe('READY_FOR_PAYMENT');
    expect(result.submittedAt).not.toBeNull();
    expect(result.submittedByUserId).toBe(f.userId);
  });

  it('rejects finish from non-draft status', async () => {
    const f = await buildFixture();
    await f.useCase.execute(f.transactionId, f.auth);
    await expect(f.useCase.execute(f.transactionId, f.auth)).rejects.toThrow(
      LifecycleConflictError,
    );
  });

  it('rejects finish when there are no items', async () => {
    const f = await buildFixture();
    const items = await f.itemRepository.listByTransaction(f.transactionId);
    for (const item of items) {
      await f.itemRepository.delete(item.id, f.transactionId);
    }
    await expect(f.useCase.execute(f.transactionId, f.auth)).rejects.toThrow(ValidationAppError);
  });

  it('rejects finish when grand total is zero', async () => {
    const f = await buildFixture();
    const items = await f.itemRepository.listByTransaction(f.transactionId);
    for (const item of items) {
      await f.itemRepository.delete(item.id, f.transactionId);
    }
    await f.itemRepository.create({
      id: randomUUID(),
      transactionId: f.transactionId,
      materialName: 'Scrap',
      weight: 1,
      unit: 'KG',
      price: 0,
      total: 0,
    });
    await expect(f.useCase.execute(f.transactionId, f.auth)).rejects.toThrow(
      BusinessRuleViolationError,
    );
  });

  it('rejects finish by an unassigned employee', async () => {
    const f = await buildFixture();
    const otherUserId = randomUUID();
    const otherEmployeeId = randomUUID();
    await f.userRepository.create({
      id: otherUserId,
      companyId: f.companyId,
      email: 'other-finish@scrappy.test',
      passwordHash: 'hashed',
      role: 'EMPLOYEE',
    });
    await f.userRepository.linkEmployee(otherUserId, otherEmployeeId);

    await expect(
      f.useCase.execute(f.transactionId, {
        companyId: f.companyId,
        userId: otherUserId,
        role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('allows owner to finish any company draft without assignment', async () => {
    const f = await buildFixture();
    const ownerUserId = randomUUID();
    await f.userRepository.create({
      id: ownerUserId,
      companyId: f.companyId,
      email: 'owner-finish@scrappy.test',
      passwordHash: 'hashed',
      role: 'OWNER',
    });

    const result = await f.useCase.execute(f.transactionId, {
      companyId: f.companyId,
      userId: ownerUserId,
      role: 'OWNER',
    });
    expect(result.status).toBe('READY_FOR_PAYMENT');
    expect(result.submittedByUserId).toBe(ownerUserId);
  });

  it('allows manager to finish any company draft without assignment', async () => {
    const f = await buildFixture();
    const managerUserId = randomUUID();
    await f.userRepository.create({
      id: managerUserId,
      companyId: f.companyId,
      email: 'manager-finish@scrappy.test',
      passwordHash: 'hashed',
      role: 'MANAGER',
    });

    const result = await f.useCase.execute(f.transactionId, {
      companyId: f.companyId,
      userId: managerUserId,
      role: 'MANAGER',
    });
    expect(result.status).toBe('READY_FOR_PAYMENT');
    expect(result.submittedByUserId).toBe(managerUserId);
  });
});
