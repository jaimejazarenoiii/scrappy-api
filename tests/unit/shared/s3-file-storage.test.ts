import { describe, expect, it, vi } from 'vitest';
import { S3FileStorage } from '../../../src/modules/transaction/infrastructure/file-storage/s3-file-storage.js';
import { S3ExpenseFileStorage } from '../../../src/modules/expense/infrastructure/file-storage/s3-expense-file-storage.js';
import type { S3ObjectStore } from '../../../src/shared/storage/s3-object-store.js';
import { resolveFileStorageDriver } from '../../../src/config/env.schema.js';

describe('S3 file storage adapters', () => {
  it('saves transaction files under transactions/{companyId}/{transactionId}/', async () => {
    const put = vi.fn(async () => undefined);
    const store = { put, get: vi.fn(), delete: vi.fn() } as unknown as S3ObjectStore;
    const storage = new S3FileStorage(store);

    const saved = await storage.save({
      companyId: 'c1',
      transactionId: 't1',
      fileName: 'receipt.jpg',
      mimeType: 'image/jpeg',
      content: Buffer.from('photo'),
    });

    expect(saved.filePath.startsWith('transactions/c1/t1/')).toBe(true);
    expect(saved.filePath.endsWith('.jpg')).toBe(true);
    expect(saved.fileSize).toBe(5);
    expect(put).toHaveBeenCalledWith(saved.filePath, Buffer.from('photo'), 'image/jpeg');
  });

  it('saves expense files under expenses/{companyId}/{expenseId}/', async () => {
    const put = vi.fn(async () => undefined);
    const store = { put, get: vi.fn(), delete: vi.fn() } as unknown as S3ObjectStore;
    const storage = new S3ExpenseFileStorage(store);

    const saved = await storage.save({
      companyId: 'c1',
      expenseId: 'e1',
      fileName: 'bill.png',
      mimeType: 'image/png',
      content: Buffer.from('img'),
    });

    expect(saved.filePath.startsWith('expenses/c1/e1/')).toBe(true);
    expect(saved.filePath.endsWith('.png')).toBe(true);
    expect(put).toHaveBeenCalledWith(saved.filePath, Buffer.from('img'), 'image/png');
  });

  it('reads and deletes by object key', async () => {
    const get = vi.fn(async () => Buffer.from('data'));
    const del = vi.fn(async () => undefined);
    const store = { put: vi.fn(), get, delete: del } as unknown as S3ObjectStore;
    const storage = new S3FileStorage(store);

    await expect(storage.read('transactions/c1/t1/a.jpg')).resolves.toEqual(Buffer.from('data'));
    await storage.delete('transactions/c1/t1/a.jpg');
    expect(del).toHaveBeenCalledWith('transactions/c1/t1/a.jpg');
  });
});

describe('resolveFileStorageDriver', () => {
  it('defaults to local outside production', () => {
    expect(
      resolveFileStorageDriver({
        NODE_ENV: 'development',
        FILE_STORAGE_DRIVER: undefined,
      } as never),
    ).toBe('local');
    expect(
      resolveFileStorageDriver({
        NODE_ENV: 'test',
        FILE_STORAGE_DRIVER: undefined,
      } as never),
    ).toBe('local');
  });

  it('defaults to s3 in production unless overridden', () => {
    expect(
      resolveFileStorageDriver({
        NODE_ENV: 'production',
        FILE_STORAGE_DRIVER: undefined,
      } as never),
    ).toBe('s3');
    expect(
      resolveFileStorageDriver({
        NODE_ENV: 'production',
        FILE_STORAGE_DRIVER: 'local',
      } as never),
    ).toBe('local');
  });
});
