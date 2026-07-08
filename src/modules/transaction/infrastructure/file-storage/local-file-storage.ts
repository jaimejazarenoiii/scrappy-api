import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { extname } from 'node:path';
import type { FileStorage, SaveFileParams, SavedFile } from './file-storage.interface.js';

/**
 * Filesystem-backed FileStorage implementation. Files are written under
 * `{UPLOAD_DIR}/transactions/{companyId}/{transactionId}/` and the returned `filePath`
 * is relative to the base directory so it can be persisted and later resolved.
 */
export class LocalFileStorage implements FileStorage {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? process.env.UPLOAD_DIR ?? 'uploads';
  }

  async save(params: SaveFileParams): Promise<SavedFile> {
    const relativeDir = path.posix.join('transactions', params.companyId, params.transactionId);
    const absoluteDir = path.join(this.baseDir, relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const extension = extname(params.fileName) || this.extensionFromMime(params.mimeType);
    const storedName = `${randomUUID()}${extension}`;
    const relativePath = path.posix.join(relativeDir, storedName);
    const absolutePath = path.join(this.baseDir, ...relativePath.split('/'));

    await writeFile(absolutePath, params.content);

    return { filePath: relativePath, fileSize: params.content.length };
  }

  async read(filePath: string): Promise<Buffer> {
    return readFile(this.resolvePath(filePath));
  }

  async delete(filePath: string): Promise<void> {
    await rm(this.resolvePath(filePath), { force: true });
  }

  resolvePath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    return path.join(this.baseDir, ...normalized.split('/'));
  }

  private extensionFromMime(mimeType: string): string {
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
}
