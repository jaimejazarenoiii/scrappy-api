import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { ReturnToDraftUseCase } from '../../../src/modules/transaction/application/use-cases/return-to-draft.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import {
  ForbiddenError,
  LifecycleConflictError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

async function buildFixture(status: 'DRAFT' | 'READY_FOR_PAYMENT' | 'PAID' = 'READY_FOR_PAYMENT') {
  const companyId = randomUUID();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const detail = await transactionRepository.create({
    id: randomUUID(),
    companyId,
    createdByUserId: randomUUID(),
    transactionNumber: 'IN-20260708-000010',
    direction: 'INBOUND',
    partyName: 'Acme',
    transactionDate: new Date(),
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [],
    items: [],
  });

  if (status !== 'DRAFT') {
    await transactionRepository.update(detail.transaction.id, companyId, {
      status,
      submittedAt: new Date(),
      submittedByUserId: randomUUID(),
      ...(status === 'PAID' ? { paidAt: new Date(), paidByUserId: randomUUID() } : {}),
    });
  }

  return {
    companyId,
    transactionId: detail.transaction.id,
    transactionRepository,
    useCase: new ReturnToDraftUseCase(transactionRepository),
  };
}

describe('ReturnToDraftUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('returns a ready-for-payment transaction to draft for managers', async () => {
    const f = await buildFixture();
    const auth: AuthorizationContext = {
      companyId: f.companyId,
      userId: randomUUID(),
      role: 'MANAGER',
    };
    const result = await f.useCase.execute(f.transactionId, auth, { reason: 'Fix weight' });
    expect(result.status).toBe('DRAFT');
  });

  it('rejects employees returning to draft', async () => {
    const f = await buildFixture();
    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId: randomUUID(), role: 'EMPLOYEE' },
        {},
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('rejects return from paid status', async () => {
    const f = await buildFixture('PAID');
    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId: randomUUID(), role: 'OWNER' },
        {},
      ),
    ).rejects.toThrow(LifecycleConflictError);
  });
});
