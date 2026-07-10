import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { extname } from 'node:path';
import type {
  ExpenseFileStorage,
  SaveExpenseFileParams,
  SavedExpenseFile,
} from './expense-file-storage.js';

export class LocalExpenseFileStorage implements ExpenseFileStorage {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? process.env.UPLOAD_DIR ?? 'uploads';
  }

  async save(params: SaveExpenseFileParams): Promise<SavedExpenseFile> {
    const relativeDir = path.posix.join('expenses', params.companyId, params.expenseId);
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
