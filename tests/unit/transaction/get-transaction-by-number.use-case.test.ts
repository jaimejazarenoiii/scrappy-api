import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { GetTransactionByNumberUseCase } from '../../../src/modules/transaction/application/use-cases/get-transaction-by-number.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import {
  ForbiddenError,
  ResourceNotFoundError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

async function buildFixture() {
  const companyId = randomUUID();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const userRepository = new InMemoryUserRepository();
  const employeeId = randomUUID();
  const userId = randomUUID();

  await userRepository.create({
    id: userId,
    companyId,
    email: 'lookup@scrappy.test',
    passwordHash: 'hashed',
    role: 'EMPLOYEE',
  });
  await userRepository.linkEmployee(userId, employeeId);

  const detail = await transactionRepository.create({
    id: randomUUID(),
    companyId,
    createdByUserId: userId,
    transactionNumber: 'IN-20260708-000050',
    direction: 'INBOUND',
    partyName: 'Acme',
    transactionDate: new Date(),
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [employeeId],
    items: [],
  });

  return {
    companyId,
    userId,
    employeeId,
    transactionNumber: detail.transaction.transactionNumber,
    transactionId: detail.transaction.id,
    transactionRepository,
    userRepository,
    useCase: new GetTransactionByNumberUseCase(transactionRepository, userRepository),
  };
}

describe('GetTransactionByNumberUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('returns the matching transaction for managers', async () => {
    const f = await buildFixture();
    const auth: AuthorizationContext = {
      companyId: f.companyId,
      userId: randomUUID(),
      role: 'MANAGER',
    };
    const result = await f.useCase.execute(f.transactionNumber, auth);
    expect(result.id).toBe(f.transactionId);
    expect(result.transactionNumber).toBe(f.transactionNumber);
  });

  it('returns 404 for unknown numbers in the company', async () => {
    const f = await buildFixture();
    await expect(
      f.useCase.execute('IN-20260708-999999', {
        companyId: f.companyId,
        userId: randomUUID(),
        role: 'OWNER',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('rejects unassigned employees', async () => {
    const f = await buildFixture();
    const otherUserId = randomUUID();
    await f.userRepository.create({
      id: otherUserId,
      companyId: f.companyId,
      email: 'unassigned-lookup@scrappy.test',
      passwordHash: 'hashed',
      role: 'EMPLOYEE',
    });
    await f.userRepository.linkEmployee(otherUserId, randomUUID());

    await expect(
      f.useCase.execute(f.transactionNumber, {
        companyId: f.companyId,
        userId: otherUserId,
        role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
