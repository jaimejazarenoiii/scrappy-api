import { loadConfig } from '../../config/index.js';
import { resolveFileStorageDriver, type Env } from '../../config/env.schema.js';
import { LocalExpenseFileStorage } from '../../modules/expense/infrastructure/file-storage/local-expense-file-storage.js';
import { S3ExpenseFileStorage } from '../../modules/expense/infrastructure/file-storage/s3-expense-file-storage.js';
import type { ExpenseFileStorage } from '../../modules/expense/infrastructure/file-storage/expense-file-storage.js';
import { LocalFileStorage } from '../../modules/transaction/infrastructure/file-storage/local-file-storage.js';
import { S3FileStorage } from '../../modules/transaction/infrastructure/file-storage/s3-file-storage.js';
import type { FileStorage } from '../../modules/transaction/infrastructure/file-storage/file-storage.interface.js';
import { createS3ClientFromEnv } from './s3-client.js';
import { S3ObjectStore } from './s3-object-store.js';

export interface AttachmentFileStorages {
  fileStorage: FileStorage;
  expenseFileStorage: ExpenseFileStorage;
  driver: 'local' | 's3';
}

export function createAttachmentFileStorages(env: Env = loadConfig()): AttachmentFileStorages {
  const driver = resolveFileStorageDriver(env);

  if (driver === 'local') {
    return {
      driver,
      fileStorage: new LocalFileStorage(env.UPLOAD_DIR),
      expenseFileStorage: new LocalExpenseFileStorage(env.UPLOAD_DIR),
    };
  }

  if (!env.S3_BUCKET) {
    throw new Error('S3_BUCKET is required when file storage driver is s3');
  }

  const store = new S3ObjectStore(createS3ClientFromEnv(env), env.S3_BUCKET);
  return {
    driver,
    fileStorage: new S3FileStorage(store),
    expenseFileStorage: new S3ExpenseFileStorage(store),
  };
}
