import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { ReopenTransactionUseCase } from '../../../src/modules/transaction/application/use-cases/reopen-transaction.use-case.js';
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

async function buildFixture(status: 'DRAFT' | 'PAID' = 'PAID') {
  const companyId = randomUUID();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const detail = await transactionRepository.create({
    id: randomUUID(),
    companyId,
    createdByUserId: randomUUID(),
    transactionNumber: 'IN-20260708-000030',
    direction: 'INBOUND',
    partyName: 'Acme',
    transactionDate: new Date(),
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [],
    items: [],
  });

  if (status === 'PAID') {
    await transactionRepository.update(detail.transaction.id, companyId, {
      status: 'PAID',
      submittedAt: new Date(),
      submittedByUserId: randomUUID(),
      paidAt: new Date(),
      paidByUserId: randomUUID(),
    });
  }

  return {
    companyId,
    transactionId: detail.transaction.id,
    useCase: new ReopenTransactionUseCase(transactionRepository),
  };
}

describe('ReopenTransactionUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('reopens a paid transaction as owner and clears paid metadata', async () => {
    const f = await buildFixture();
    const auth: AuthorizationContext = {
      companyId: f.companyId,
      userId: randomUUID(),
      role: 'OWNER',
    };
    const result = await f.useCase.execute(f.transactionId, auth, {
      reason: 'Incorrect weight',
    });
    expect(result.status).toBe('READY_FOR_PAYMENT');
    expect(result.paidAt).toBeNull();
    expect(result.paidByUserId).toBeNull();
    expect(result.reopenedAt).not.toBeNull();
    expect(result.reopenedByUserId).toBe(auth.userId);
    expect(result.reopenReason).toBe('Incorrect weight');
  });

  it('rejects reopen by managers', async () => {
    const f = await buildFixture();
    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId: randomUUID(), role: 'MANAGER' },
        { reason: 'No' },
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('rejects reopen when not paid', async () => {
    const f = await buildFixture('DRAFT');
    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId: randomUUID(), role: 'OWNER' },
        { reason: 'Not paid' },
      ),
    ).rejects.toThrow(LifecycleConflictError);
  });
});
