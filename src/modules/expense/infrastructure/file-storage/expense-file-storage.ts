export interface SaveExpenseFileParams {
  companyId: string;
  expenseId: string;
  fileName: string;
  mimeType: string;
  content: Buffer;
}

export interface SavedExpenseFile {
  filePath: string;
  fileSize: number;
}

export interface ExpenseFileStorage {
  save(params: SaveExpenseFileParams): Promise<SavedExpenseFile>;
  read(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  resolvePath(filePath: string): string;
}
