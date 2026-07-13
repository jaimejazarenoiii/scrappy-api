import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { S3ObjectStore } from '../../../../shared/storage/s3-object-store.js';
import type { FileStorage, SaveFileParams, SavedFile } from './file-storage.interface.js';

export class S3FileStorage implements FileStorage {
  constructor(private readonly store: S3ObjectStore) {}

  async save(params: SaveFileParams): Promise<SavedFile> {
    const extension = extname(params.fileName) || extensionFromMime(params.mimeType);
    const key = [
      'transactions',
      params.companyId,
      params.transactionId,
      `${randomUUID()}${extension}`,
    ].join('/');

    await this.store.put(key, params.content, params.mimeType);
    return { filePath: key, fileSize: params.content.length };
  }

  async read(filePath: string): Promise<Buffer> {
    return this.store.get(normalizeKey(filePath));
  }

  async delete(filePath: string): Promise<void> {
    await this.store.delete(normalizeKey(filePath));
  }

  resolvePath(filePath: string): string {
    return normalizeKey(filePath);
  }
}

function normalizeKey(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

function extensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}
