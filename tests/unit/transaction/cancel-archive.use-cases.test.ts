import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { CancelTransactionUseCase } from '../../../src/modules/transaction/application/use-cases/cancel-transaction.use-case.js';
import { ArchiveTransactionUseCase } from '../../../src/modules/transaction/application/use-cases/archive-transaction.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import { LifecycleConflictError } from '../../../src/shared/errors/http-exceptions.js';
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
    assignedEmployeeIds: [],
    items: [],
  });
  const auth: AuthorizationContext = { companyId, userId: randomUUID(), role: 'MANAGER' };
  return {
    companyId,
    transactionId: detail.transaction.id,
    transactionRepository,
    auth,
    cancel: new CancelTransactionUseCase(transactionRepository, userRepository),
    archive: new ArchiveTransactionUseCase(transactionRepository),
  };
}

describe('CancelTransactionUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('cancels a draft transaction', async () => {
    const f = await buildFixture();
    const result = await f.cancel.execute(f.transactionId, f.auth, {
      cancellationReason: 'Duplicate',
    });
    expect(result.status).toBe('CANCELLED');
    expect(result.cancellationReason).toBe('Duplicate');
    expect(result.cancelledAt).not.toBeNull();
  });

  it('rejects cancelling an already cancelled transaction', async () => {
    const f = await buildFixture();
    await f.cancel.execute(f.transactionId, f.auth, {});
    await expect(f.cancel.execute(f.transactionId, f.auth, {})).rejects.toThrow(
      LifecycleConflictError,
    );
  });
});

describe('ArchiveTransactionUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('archives a transaction via soft delete', async () => {
    const f = await buildFixture();
    const result = await f.archive.execute(f.transactionId, f.auth);
    expect(result.deletedAt).not.toBeNull();
  });

  it('rejects archiving an already archived transaction', async () => {
    const f = await buildFixture();
    await f.archive.execute(f.transactionId, f.auth);
    await expect(f.archive.execute(f.transactionId, f.auth)).rejects.toThrow(
      LifecycleConflictError,
    );
  });
});
