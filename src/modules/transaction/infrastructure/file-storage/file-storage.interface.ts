export interface SaveFileParams {
  companyId: string;
  transactionId: string;
  fileName: string;
  mimeType: string;
  content: Buffer;
}

export interface SavedFile {
  filePath: string;
  fileSize: number;
}

export interface FileStorage {
  save(params: SaveFileParams): Promise<SavedFile>;
  read(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  resolvePath(filePath: string): string;
}
