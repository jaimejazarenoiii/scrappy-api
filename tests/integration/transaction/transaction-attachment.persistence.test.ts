import { randomUUID } from 'node:crypto';
import { access, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalFileStorage } from '../../../src/modules/transaction/infrastructure/file-storage/local-file-storage.js';
import {
  InMemoryTransactionAttachmentRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';

const baseDir = path.join(tmpdir(), `scrappy-uploads-${randomUUID()}`);

afterEach(async () => {
  await rm(baseDir, { recursive: true, force: true });
});

describe('LocalFileStorage', () => {
  it('saves a file to disk and deletes it', async () => {
    const storage = new LocalFileStorage(baseDir);
    const content = Buffer.from('image-bytes');
    const saved = await storage.save({
      companyId: 'c1',
      transactionId: 't1',
      fileName: 'receipt.jpg',
      mimeType: 'image/jpeg',
      content,
    });

    expect(saved.fileSize).toBe(content.length);
    const absolute = storage.resolvePath(saved.filePath);
    await expect(access(absolute)).resolves.toBeUndefined();
    expect((await readFile(absolute)).equals(content)).toBe(true);

    await storage.delete(saved.filePath);
    await expect(access(absolute)).rejects.toThrow();
  });
});

describe('transaction attachment persistence', () => {
  it('persists attachment metadata scoped to the parent transaction', async () => {
    const store = new InMemoryTransactionStore();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const attachmentRepo = new InMemoryTransactionAttachmentRepository(store);
    const companyId = randomUUID();
    const detail = await transactionRepo.create({
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
    const transactionId = detail.transaction.id;

    const attachment = await attachmentRepo.create({
      id: randomUUID(),
      transactionId,
      attachmentType: 'PHOTO',
      fileName: 'receipt.jpg',
      filePath: 'transactions/c/t/file.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      uploadedByUserId: randomUUID(),
    });

    expect(await attachmentRepo.countByTransaction(transactionId)).toBe(1);
    expect(await attachmentRepo.findById(attachment.id, transactionId)).not.toBeNull();
    expect(await attachmentRepo.findById(attachment.id, randomUUID())).toBeNull();
  });
});
