import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { SettleTransactionUseCase } from '../../../src/modules/transaction/application/use-cases/settle-transaction.use-case.js';
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
    transactionNumber: 'IN-20260708-000020',
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
    useCase: new SettleTransactionUseCase(transactionRepository),
  };
}

describe('SettleTransactionUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('settles a ready-for-payment transaction', async () => {
    const f = await buildFixture();
    const auth: AuthorizationContext = {
      companyId: f.companyId,
      userId: randomUUID(),
      role: 'MANAGER',
    };
    const result = await f.useCase.execute(f.transactionId, auth, {
      settlementNote: 'Cash',
    });
    expect(result.status).toBe('PAID');
    expect(result.paidAt).not.toBeNull();
    expect(result.paidByUserId).toBe(auth.userId);
  });

  it('rejects settle from draft', async () => {
    const f = await buildFixture('DRAFT');
    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId: randomUUID(), role: 'MANAGER' },
        {},
      ),
    ).rejects.toThrow(LifecycleConflictError);
  });

  it('rejects duplicate settle', async () => {
    const f = await buildFixture('PAID');
    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId: randomUUID(), role: 'OWNER' },
        {},
      ),
    ).rejects.toThrow(LifecycleConflictError);
  });

  it('rejects settle by employees', async () => {
    const f = await buildFixture();
    await expect(
      f.useCase.execute(
        f.transactionId,
        { companyId: f.companyId, userId: randomUUID(), role: 'EMPLOYEE' },
        {},
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});
