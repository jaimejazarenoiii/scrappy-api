import { randomUUID } from 'node:crypto';
import { ExpenseEntity } from '../../src/modules/expense/domain/expense.entity.js';
import { ExpenseAttachmentEntity } from '../../src/modules/expense/domain/expense-attachment.entity.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../src/shared/errors/http-exceptions.js';
import type {
  CancelExpenseInput,
  CreateExpenseInput,
  ExpenseRepository,
  ListExpensesQuery,
  RecordExpenseInput,
  UpdateExpenseInput,
} from '../../src/modules/expense/domain/expense.repository.js';
import type {
  CreateExpenseAttachmentInput,
  ExpenseAttachmentRepository,
} from '../../src/modules/expense/domain/expense-attachment.repository.js';
import type { ExpenseNumberSequenceRepository } from '../../src/modules/expense/domain/expense-number-sequence.repository.js';
import type {
  ExpenseFileStorage,
  SaveExpenseFileParams,
  SavedExpenseFile,
} from '../../src/modules/expense/infrastructure/file-storage/expense-file-storage.js';

function sequenceKey(companyId: string, sequenceDate: Date): string {
  return `${companyId}:${sequenceDate.toISOString().slice(0, 10)}`;
}

function matchesListQuery(expense: ExpenseEntity, query: ListExpensesQuery): boolean {
  const props = expense.toPrimitives();
  if (!query.includeArchived && props.deletedAt) return false;
  if (query.status && props.status !== query.status) return false;
  if (query.category && !props.category.toLowerCase().includes(query.category.toLowerCase())) {
    return false;
  }
  if (query.contextType && props.contextType !== query.contextType) return false;
  if (query.branchId && props.branchId !== query.branchId) return false;
  if (query.warehouseId && props.warehouseId !== query.warehouseId) return false;
  if (query.vehicleId && props.vehicleId !== query.vehicleId) return false;
  if (query.tripId && props.tripId !== query.tripId) return false;
  if (query.employeeId && props.createdByEmployeeId !== query.employeeId) return false;
  if (
    query.expenseNumber &&
    !props.expenseNumber.toLowerCase().includes(query.expenseNumber.toLowerCase())
  ) {
    return false;
  }
  if (query.fromDate && props.expenseDate < query.fromDate) return false;
  if (query.toDate && props.expenseDate > query.toDate) return false;
  if (query.search && query.search.length >= 2) {
    const needle = query.search.toLowerCase();
    const haystack = `${props.expenseNumber} ${props.category} ${props.description}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function sortExpenses(items: ExpenseEntity[], query: ListExpensesQuery): ExpenseEntity[] {
  const sortBy = query.sortBy ?? 'expenseDate';
  const sortOrder = query.sortOrder ?? 'desc';
  return [...items].sort((left, right) => {
    const leftProps = left.toPrimitives();
    const rightProps = right.toPrimitives();
    const leftValue = leftProps[sortBy];
    const rightValue = rightProps[sortBy];
    const order = sortOrder === 'desc' ? -1 : 1;
    if (leftValue < rightValue) return -1 * order;
    if (leftValue > rightValue) return 1 * order;
    return 0;
  });
}

export class InMemoryExpenseStore {
  expenses = new Map<string, ExpenseEntity>();
  attachments = new Map<string, ExpenseAttachmentEntity>();
}

export class InMemoryExpenseNumberSequenceRepository implements ExpenseNumberSequenceRepository {
  constructor(private readonly store: InMemoryExpenseStore) {}

  sequences = new Map<string, number>();

  async allocateNext(companyId: string, sequenceDate: Date): Promise<number> {
    const key = sequenceKey(companyId, sequenceDate);
    const next = (this.sequences.get(key) ?? 0) + 1;
    this.sequences.set(key, next);
    return next;
  }
}

export class InMemoryExpenseAttachmentRepository implements ExpenseAttachmentRepository {
  constructor(private readonly store: InMemoryExpenseStore) {}

  async create(input: CreateExpenseAttachmentInput) {
    const attachment = ExpenseAttachmentEntity.create({
      id: input.id,
      expenseId: input.expenseId,
      attachmentType: input.attachmentType,
      fileName: input.fileName,
      filePath: input.filePath,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      uploadedByUserId: input.uploadedByUserId,
      createdAt: new Date(),
    });
    this.store.attachments.set(attachment.id, attachment);
    return attachment;
  }

  async findById(attachmentId: string, expenseId: string) {
    const attachment = this.store.attachments.get(attachmentId);
    if (!attachment || attachment.expenseId !== expenseId) return null;
    return attachment;
  }

  async listByExpense(expenseId: string) {
    return [...this.store.attachments.values()]
      .filter((attachment) => attachment.expenseId === expenseId)
      .sort((a, b) => a.toPrimitives().createdAt.getTime() - b.toPrimitives().createdAt.getTime());
  }

  async countByExpense(expenseId: string): Promise<number> {
    return [...this.store.attachments.values()].filter((a) => a.expenseId === expenseId).length;
  }

  async delete(attachmentId: string, expenseId: string): Promise<void> {
    const attachment = await this.findById(attachmentId, expenseId);
    if (attachment) this.store.attachments.delete(attachmentId);
  }
}

export class InMemoryExpenseFileStorage implements ExpenseFileStorage {
  files = new Map<string, Buffer>();

  async save(params: SaveExpenseFileParams): Promise<SavedExpenseFile> {
    const filePath = `expenses/${params.companyId}/${params.expenseId}/${randomUUID()}`;
    this.files.set(filePath, params.content);
    return { filePath, fileSize: params.content.length };
  }

  async read(filePath: string): Promise<Buffer> {
    return this.files.get(filePath) ?? Buffer.alloc(0);
  }

  async delete(filePath: string): Promise<void> {
    this.files.delete(filePath);
  }

  resolvePath(filePath: string): string {
    return filePath;
  }
}

export class InMemoryExpenseRepository implements ExpenseRepository {
  constructor(
    private readonly store: InMemoryExpenseStore,
    private readonly attachmentRepository: InMemoryExpenseAttachmentRepository,
  ) {}

  async create(input: CreateExpenseInput) {
    const now = new Date();
    const expense = ExpenseEntity.create({
      id: input.id,
      companyId: input.companyId,
      expenseNumber: input.expenseNumber,
      expenseDate: input.expenseDate,
      category: input.category,
      amount: input.amount,
      description: input.description,
      status: input.status,
      contextType: input.contextType,
      branchId: input.branchId ?? null,
      warehouseId: input.warehouseId ?? null,
      vehicleId: input.vehicleId ?? null,
      tripId: input.tripId ?? null,
      createdByUserId: input.createdByUserId,
      createdByEmployeeId: input.createdByEmployeeId ?? null,
      updatedByUserId: input.updatedByUserId ?? null,
      recordedByUserId: input.recordedByUserId ?? null,
      recordedAt: input.recordedAt ?? null,
      cancelledByUserId: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    this.store.expenses.set(expense.id, expense);
    return { expense, attachments: [] };
  }

  async findById(expenseId: string, companyId: string) {
    const expense = this.store.expenses.get(expenseId);
    if (!expense || expense.companyId !== companyId || expense.deletedAt) return null;
    return expense;
  }

  async findByExpenseNumber(expenseNumber: string, companyId: string) {
    for (const expense of this.store.expenses.values()) {
      if (
        expense.expenseNumber === expenseNumber &&
        expense.companyId === companyId &&
        !expense.deletedAt
      ) {
        return expense;
      }
    }
    return null;
  }

  async findByIdIncludingArchived(expenseId: string, companyId: string) {
    const expense = this.store.expenses.get(expenseId);
    if (!expense || expense.companyId !== companyId) return null;
    return expense;
  }

  async findDetailById(
    expenseId: string,
    companyId: string,
    options?: { includeArchived?: boolean },
  ) {
    const expense = options?.includeArchived
      ? await this.findByIdIncludingArchived(expenseId, companyId)
      : await this.findById(expenseId, companyId);
    if (!expense) return null;
    const attachments = await this.attachmentRepository.listByExpense(expenseId);
    return { expense, attachments };
  }

  async update(expenseId: string, companyId: string, input: UpdateExpenseInput) {
    const existing = await this.findById(expenseId, companyId);
    if (!existing) throw new ResourceNotFoundError('Expense not found');
    const props = existing.toPrimitives();
    const updated = ExpenseEntity.create({
      ...props,
      expenseDate: input.expenseDate ?? props.expenseDate,
      category: input.category ?? props.category,
      amount: input.amount ?? props.amount,
      description: input.description ?? props.description,
      contextType: input.contextType ?? props.contextType,
      branchId: input.branchId !== undefined ? input.branchId : props.branchId,
      warehouseId: input.warehouseId !== undefined ? input.warehouseId : props.warehouseId,
      vehicleId: input.vehicleId !== undefined ? input.vehicleId : props.vehicleId,
      tripId: input.tripId !== undefined ? input.tripId : props.tripId,
      updatedByUserId: input.updatedByUserId ?? props.updatedByUserId,
      updatedAt: new Date(),
    });
    this.store.expenses.set(expenseId, updated);
    const detail = await this.findDetailById(expenseId, companyId);
    if (!detail) throw new ResourceNotFoundError('Expense not found');
    return detail;
  }

  async record(expenseId: string, companyId: string, input: RecordExpenseInput) {
    const existing = await this.findById(expenseId, companyId);
    if (!existing || !existing.isDraft()) {
      throw new LifecycleConflictError('Expense cannot be recorded in its current state.');
    }
    const props = existing.toPrimitives();
    const updated = ExpenseEntity.create({
      ...props,
      status: 'RECORDED',
      recordedByUserId: input.recordedByUserId,
      recordedAt: input.recordedAt,
      updatedByUserId: input.updatedByUserId,
      updatedAt: new Date(),
    });
    this.store.expenses.set(expenseId, updated);
    return updated;
  }

  async cancel(expenseId: string, companyId: string, input: CancelExpenseInput) {
    const existing = await this.findById(expenseId, companyId);
    if (!existing || existing.isCancelled()) {
      throw new LifecycleConflictError('Expense cannot be cancelled in its current state.');
    }
    const props = existing.toPrimitives();
    const updated = ExpenseEntity.create({
      ...props,
      status: 'CANCELLED',
      cancelledByUserId: input.cancelledByUserId,
      cancelledAt: input.cancelledAt,
      cancellationReason: input.cancellationReason,
      updatedByUserId: input.updatedByUserId,
      updatedAt: new Date(),
    });
    this.store.expenses.set(expenseId, updated);
    return updated;
  }

  async archive(expenseId: string, companyId: string) {
    const existing = await this.findById(expenseId, companyId);
    if (!existing || (!existing.isRecorded() && !existing.isCancelled())) {
      throw new LifecycleConflictError('Expense cannot be archived in its current state.');
    }
    const props = existing.toPrimitives();
    const updated = ExpenseEntity.create({
      ...props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
    this.store.expenses.set(expenseId, updated);
    return updated;
  }

  async listByCompany(companyId: string, query: ListExpensesQuery) {
    return this.listInternal(companyId, query);
  }

  async listByEmployee(companyId: string, employeeId: string, query: ListExpensesQuery) {
    return this.listInternal(companyId, { ...query, employeeId });
  }

  async listDistinctCategories(companyId: string) {
    const categories = new Set<string>();
    for (const expense of this.store.expenses.values()) {
      const props = expense.toPrimitives();
      if (props.companyId !== companyId || props.deletedAt) continue;
      categories.add(props.category);
    }
    return [...categories].sort((left, right) => left.localeCompare(right));
  }

  private async listInternal(companyId: string, query: ListExpensesQuery) {
    const filtered = [...this.store.expenses.values()].filter(
      (expense) => expense.companyId === companyId && matchesListQuery(expense, query),
    );
    const sorted = sortExpenses(filtered, query);
    const start = (query.page - 1) * query.limit;
    const pageItems = sorted.slice(start, start + query.limit);
    const items = await Promise.all(
      pageItems.map(async (expense) => ({
        expense,
        attachmentCount: await this.attachmentRepository.countByExpense(expense.id),
      })),
    );
    return { items, total: sorted.length };
  }
}
