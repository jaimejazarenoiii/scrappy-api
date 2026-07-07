import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { ListTransactionsUseCase } from '../../../src/modules/transaction/application/use-cases/list-transactions.use-case.js';
import { ListAssignedTransactionsUseCase } from '../../../src/modules/transaction/application/use-cases/list-assigned-transactions.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import { ForbiddenError } from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

const baseCreate = (companyId: string, overrides: Record<string, unknown> = {}) => ({
  id: randomUUID(),
  companyId,
  createdByUserId: randomUUID(),
  direction: 'INBOUND' as const,
  partyName: 'Acme',
  transactionDate: new Date(),
  locationType: 'OUTSIDE' as const,
  outsideLocationName: 'Roadside',
  outsideAddress: '123 Lane',
  assignedEmployeeIds: [] as string[],
  items: [],
  ...overrides,
});

describe('ListTransactionsUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('lists company transactions for managers', async () => {
    const companyId = randomUUID();
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    await repo.create(baseCreate(companyId, { direction: 'INBOUND' }));
    await repo.create(baseCreate(companyId, { direction: 'OUTBOUND' }));

    const useCase = new ListTransactionsUseCase(repo);
    const auth: AuthorizationContext = { companyId, userId: randomUUID(), role: 'MANAGER' };
    const result = await useCase.execute(auth, { page: 1, limit: 20 });
    expect(result.items).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('filters by direction', async () => {
    const companyId = randomUUID();
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    await repo.create(baseCreate(companyId, { direction: 'INBOUND' }));
    await repo.create(baseCreate(companyId, { direction: 'OUTBOUND' }));

    const useCase = new ListTransactionsUseCase(repo);
    const auth: AuthorizationContext = { companyId, userId: randomUUID(), role: 'OWNER' };
    const result = await useCase.execute(auth, { page: 1, limit: 20, direction: 'OUTBOUND' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.direction).toBe('OUTBOUND');
  });

  it('forbids employees from listing company transactions', async () => {
    const companyId = randomUUID();
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const useCase = new ListTransactionsUseCase(repo);
    const auth: AuthorizationContext = { companyId, userId: randomUUID(), role: 'EMPLOYEE' };
    await expect(useCase.execute(auth, { page: 1, limit: 20 })).rejects.toThrow(ForbiddenError);
  });

  it('excludes archived transactions unless requested', async () => {
    const companyId = randomUUID();
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const detail = await repo.create(baseCreate(companyId));
    await repo.archive(detail.transaction.id, companyId);

    const useCase = new ListTransactionsUseCase(repo);
    const auth: AuthorizationContext = { companyId, userId: randomUUID(), role: 'MANAGER' };
    const excluded = await useCase.execute(auth, { page: 1, limit: 20 });
    expect(excluded.items).toHaveLength(0);
    const included = await useCase.execute(auth, { page: 1, limit: 20, includeArchived: true });
    expect(included.items).toHaveLength(1);
  });
});

describe('ListAssignedTransactionsUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('lists only transactions assigned to the acting employee', async () => {
    const companyId = randomUUID();
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const userRepository = new InMemoryUserRepository();

    const employeeId = randomUUID();
    const userId = randomUUID();
    await userRepository.create({
      id: userId,
      companyId,
      email: 'worker@scrappy.test',
      passwordHash: 'hashed',
      role: 'EMPLOYEE',
    });
    await userRepository.linkEmployee(userId, employeeId);

    await repo.create(baseCreate(companyId, { assignedEmployeeIds: [employeeId] }));
    await repo.create(baseCreate(companyId, { assignedEmployeeIds: [randomUUID()] }));

    const useCase = new ListAssignedTransactionsUseCase(repo, userRepository);
    const auth: AuthorizationContext = { companyId, userId, role: 'EMPLOYEE' };
    const result = await useCase.execute(auth, { page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.assignedEmployeeIds).toContain(employeeId);
  });
});
