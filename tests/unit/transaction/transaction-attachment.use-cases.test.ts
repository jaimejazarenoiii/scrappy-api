import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { AddTransactionAttachmentUseCase } from '../../../src/modules/transaction/application/use-cases/add-transaction-attachment.use-case.js';
import { ListTransactionAttachmentsUseCase } from '../../../src/modules/transaction/application/use-cases/list-transaction-attachments.use-case.js';
import { RemoveTransactionAttachmentUseCase } from '../../../src/modules/transaction/application/use-cases/remove-transaction-attachment.use-case.js';
import { MAX_TRANSACTION_PHOTOS } from '../../../src/modules/transaction/domain/attachment-constraints.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  LifecycleConflictError,
  ValidationAppError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryFileStorage,
  InMemoryTransactionAttachmentRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

const photo = (overrides: Record<string, unknown> = {}) => ({
  originalName: 'receipt.jpg',
  mimeType: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('bytes'),
  ...overrides,
});

async function buildFixture() {
  const companyId = randomUUID();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const attachmentRepository = new InMemoryTransactionAttachmentRepository(store);
  const userRepository = new InMemoryUserRepository();
  const fileStorage = new InMemoryFileStorage();

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
    attachmentRepository,
    fileStorage,
    auth,
    add: new AddTransactionAttachmentUseCase(
      transactionRepository,
      attachmentRepository,
      fileStorage,
      userRepository,
    ),
    list: new ListTransactionAttachmentsUseCase(
      transactionRepository,
      attachmentRepository,
      userRepository,
    ),
    remove: new RemoveTransactionAttachmentUseCase(
      transactionRepository,
      attachmentRepository,
      fileStorage,
      userRepository,
    ),
  };
}

describe('transaction attachment use cases', () => {
  beforeAll(() => setupTestEnv());

  it('uploads and lists attachments', async () => {
    const f = await buildFixture();
    const attachment = await f.add.execute(f.transactionId, f.auth, photo());
    expect(attachment.fileName).toBe('receipt.jpg');
    expect(f.fileStorage.files.size).toBe(1);

    const list = await f.list.execute(f.transactionId, f.auth);
    expect(list).toHaveLength(1);
  });

  it('removes an attachment and deletes the stored file', async () => {
    const f = await buildFixture();
    const attachment = await f.add.execute(f.transactionId, f.auth, photo());
    await f.remove.execute(f.transactionId, attachment.id, f.auth);
    expect(f.fileStorage.files.size).toBe(0);
    expect(await f.list.execute(f.transactionId, f.auth)).toHaveLength(0);
  });

  it('rejects a missing file', async () => {
    const f = await buildFixture();
    await expect(f.add.execute(f.transactionId, f.auth, undefined)).rejects.toThrow(
      ValidationAppError,
    );
  });

  it('rejects an unsupported mime type', async () => {
    const f = await buildFixture();
    await expect(
      f.add.execute(f.transactionId, f.auth, photo({ mimeType: 'application/pdf' })),
    ).rejects.toThrow(ValidationAppError);
  });

  it('rejects an oversized file', async () => {
    const f = await buildFixture();
    await expect(
      f.add.execute(f.transactionId, f.auth, photo({ size: 6 * 1024 * 1024 })),
    ).rejects.toThrow(ValidationAppError);
  });

  it('enforces the maximum photo count', async () => {
    const f = await buildFixture();
    for (let i = 0; i < MAX_TRANSACTION_PHOTOS; i += 1) {
      await f.add.execute(f.transactionId, f.auth, photo());
    }
    await expect(f.add.execute(f.transactionId, f.auth, photo())).rejects.toThrow(
      BusinessRuleViolationError,
    );
  });

  it('rejects uploads to a cancelled transaction', async () => {
    const f = await buildFixture();
    await f.transactionRepository.cancel(f.transactionId, f.companyId, {});
    await expect(f.add.execute(f.transactionId, f.auth, photo())).rejects.toThrow(
      LifecycleConflictError,
    );
  });
});
