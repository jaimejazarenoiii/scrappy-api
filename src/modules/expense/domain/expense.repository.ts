import type { ExpenseEntity } from './expense.entity.js';
import type { ExpenseAttachmentEntity } from './expense-attachment.entity.js';
import type { ExpenseStatus } from './expense-status.js';
import type { ExpenseContextType } from './expense-context-type.js';

export interface CreateExpenseInput {
  id: string;
  companyId: string;
  expenseNumber: string;
  expenseDate: Date;
  category: string;
  amount: number;
  description: string;
  status: ExpenseStatus;
  contextType: ExpenseContextType;
  branchId?: string | null;
  warehouseId?: string | null;
  vehicleId?: string | null;
  tripId?: string | null;
  createdByUserId: string;
  createdByEmployeeId?: string | null;
  updatedByUserId?: string | null;
  recordedByUserId?: string | null;
  recordedAt?: Date | null;
}

export interface UpdateExpenseInput {
  expenseDate?: Date;
  category?: string;
  amount?: number;
  description?: string;
  contextType?: ExpenseContextType;
  branchId?: string | null;
  warehouseId?: string | null;
  vehicleId?: string | null;
  tripId?: string | null;
  updatedByUserId?: string | null;
}

export interface RecordExpenseInput {
  recordedByUserId: string;
  recordedAt: Date;
  updatedByUserId: string;
}

export interface CancelExpenseInput {
  cancelledByUserId: string;
  cancelledAt: Date;
  cancellationReason: string;
  updatedByUserId: string;
}

export interface ListExpensesQuery {
  page: number;
  limit: number;
  sortBy?: 'expenseDate' | 'createdAt' | 'expenseNumber' | 'amount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  expenseNumber?: string;
  status?: ExpenseStatus;
  category?: string;
  contextType?: ExpenseContextType;
  branchId?: string;
  warehouseId?: string;
  vehicleId?: string;
  tripId?: string;
  employeeId?: string;
  fromDate?: Date;
  toDate?: Date;
  includeArchived?: boolean;
}

export interface ExpenseDetail {
  expense: ExpenseEntity;
  attachments: ExpenseAttachmentEntity[];
}

export interface ExpenseSummaryRow {
  expense: ExpenseEntity;
  attachmentCount: number;
}

export interface ListExpensesResult {
  items: ExpenseSummaryRow[];
  total: number;
}

export interface ExpenseRepository {
  create(input: CreateExpenseInput): Promise<ExpenseDetail>;
  findById(expenseId: string, companyId: string): Promise<ExpenseEntity | null>;
  findByExpenseNumber(expenseNumber: string, companyId: string): Promise<ExpenseEntity | null>;
  findByIdIncludingArchived(expenseId: string, companyId: string): Promise<ExpenseEntity | null>;
  findDetailById(
    expenseId: string,
    companyId: string,
    options?: { includeArchived?: boolean },
  ): Promise<ExpenseDetail | null>;
  update(expenseId: string, companyId: string, input: UpdateExpenseInput): Promise<ExpenseDetail>;
  record(expenseId: string, companyId: string, input: RecordExpenseInput): Promise<ExpenseEntity>;
  cancel(expenseId: string, companyId: string, input: CancelExpenseInput): Promise<ExpenseEntity>;
  archive(expenseId: string, companyId: string): Promise<ExpenseEntity>;
  listByCompany(companyId: string, query: ListExpensesQuery): Promise<ListExpensesResult>;
  listByEmployee(
    companyId: string,
    employeeId: string,
    query: ListExpensesQuery,
  ): Promise<ListExpensesResult>;
  listDistinctCategories(companyId: string): Promise<string[]>;
}
