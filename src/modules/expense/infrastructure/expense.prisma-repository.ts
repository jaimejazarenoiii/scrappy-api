import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../shared/errors/http-exceptions.js';
import type {
  CancelExpenseInput,
  CreateExpenseInput,
  ExpenseRepository,
  ListExpensesQuery,
  RecordExpenseInput,
  UpdateExpenseInput,
} from '../domain/expense.repository.js';
import { toExpenseDomain } from './mappers/expense.mapper.js';
import { toExpenseAttachmentDomain } from './mappers/expense-attachment.mapper.js';

function buildListWhere(companyId: string, query: ListExpensesQuery): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = { companyId };
  if (!query.includeArchived) {
    where.deletedAt = null;
  }
  if (query.status) where.status = query.status;
  if (query.category) {
    where.category = { contains: query.category, mode: 'insensitive' };
  }
  if (query.contextType) where.contextType = query.contextType;
  if (query.branchId) where.branchId = query.branchId;
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.vehicleId) where.vehicleId = query.vehicleId;
  if (query.tripId) where.tripId = query.tripId;
  if (query.employeeId) where.createdByEmployeeId = query.employeeId;
  if (query.expenseNumber) {
    where.expenseNumber = { contains: query.expenseNumber, mode: 'insensitive' };
  }
  if (query.fromDate || query.toDate) {
    where.expenseDate = {
      ...(query.fromDate ? { gte: query.fromDate } : {}),
      ...(query.toDate ? { lte: query.toDate } : {}),
    };
  }
  if (query.search && query.search.length >= 2) {
    where.OR = [
      { expenseNumber: { contains: query.search, mode: 'insensitive' } },
      { category: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

function resolveOrderBy(query: ListExpensesQuery): Prisma.ExpenseOrderByWithRelationInput[] {
  const sortBy = query.sortBy ?? 'expenseDate';
  const sortOrder = query.sortOrder ?? 'desc';
  return [{ [sortBy]: sortOrder }, { id: sortOrder }];
}

async function loadDetail(expenseId: string, companyId: string, includeArchived = false) {
  const record = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      companyId,
      ...(includeArchived ? {} : { deletedAt: null }),
    },
    include: {
      attachments: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!record) return null;
  return {
    expense: toExpenseDomain(record),
    attachments: record.attachments.map(toExpenseAttachmentDomain),
  };
}

export class ExpensePrismaRepository implements ExpenseRepository {
  async create(input: CreateExpenseInput) {
    const record = await prisma.expense.create({
      data: {
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
      },
      include: { attachments: true },
    });
    return {
      expense: toExpenseDomain(record),
      attachments: record.attachments.map(toExpenseAttachmentDomain),
    };
  }

  async findById(expenseId: string, companyId: string) {
    const record = await prisma.expense.findFirst({
      where: { id: expenseId, companyId, deletedAt: null },
    });
    return record ? toExpenseDomain(record) : null;
  }

  async findByExpenseNumber(expenseNumber: string, companyId: string) {
    const record = await prisma.expense.findFirst({
      where: { expenseNumber, companyId, deletedAt: null },
    });
    return record ? toExpenseDomain(record) : null;
  }

  async findByIdIncludingArchived(expenseId: string, companyId: string) {
    const record = await prisma.expense.findFirst({
      where: { id: expenseId, companyId },
    });
    return record ? toExpenseDomain(record) : null;
  }

  async findDetailById(
    expenseId: string,
    companyId: string,
    options?: { includeArchived?: boolean },
  ) {
    return loadDetail(expenseId, companyId, options?.includeArchived);
  }

  async update(expenseId: string, companyId: string, input: UpdateExpenseInput) {
    const existing = await this.findById(expenseId, companyId);
    if (!existing) throw new ResourceNotFoundError('Expense not found');

    await prisma.expense.update({
      where: { id: expenseId },
      data: {
        expenseDate: input.expenseDate,
        category: input.category,
        amount: input.amount,
        description: input.description,
        contextType: input.contextType,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        vehicleId: input.vehicleId,
        tripId: input.tripId,
        updatedByUserId: input.updatedByUserId,
      },
    });

    const detail = await loadDetail(expenseId, companyId);
    if (!detail) throw new ResourceNotFoundError('Expense not found');
    return detail;
  }

  async record(expenseId: string, companyId: string, input: RecordExpenseInput) {
    const result = await prisma.expense.updateMany({
      where: { id: expenseId, companyId, status: 'DRAFT', deletedAt: null },
      data: {
        status: 'RECORDED',
        recordedByUserId: input.recordedByUserId,
        recordedAt: input.recordedAt,
        updatedByUserId: input.updatedByUserId,
      },
    });
    if (result.count === 0) {
      throw new LifecycleConflictError('Expense cannot be recorded in its current state.');
    }
    const expense = await this.findById(expenseId, companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');
    return expense;
  }

  async cancel(expenseId: string, companyId: string, input: CancelExpenseInput) {
    const existing = await this.findById(expenseId, companyId);
    if (!existing) throw new ResourceNotFoundError('Expense not found');

    const result = await prisma.expense.updateMany({
      where: {
        id: expenseId,
        companyId,
        status: existing.isDraft() ? 'DRAFT' : 'RECORDED',
        deletedAt: null,
      },
      data: {
        status: 'CANCELLED',
        cancelledByUserId: input.cancelledByUserId,
        cancelledAt: input.cancelledAt,
        cancellationReason: input.cancellationReason,
        updatedByUserId: input.updatedByUserId,
      },
    });
    if (result.count === 0) {
      throw new LifecycleConflictError('Expense cannot be cancelled in its current state.');
    }
    const expense = await this.findById(expenseId, companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');
    return expense;
  }

  async archive(expenseId: string, companyId: string) {
    const result = await prisma.expense.updateMany({
      where: {
        id: expenseId,
        companyId,
        status: { in: ['RECORDED', 'CANCELLED'] },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new LifecycleConflictError('Expense cannot be archived in its current state.');
    }
    const expense = await this.findByIdIncludingArchived(expenseId, companyId);
    if (!expense) throw new ResourceNotFoundError('Expense not found');
    return expense;
  }

  async listByCompany(companyId: string, query: ListExpensesQuery) {
    return this.listInternal(companyId, query);
  }

  async listByEmployee(companyId: string, employeeId: string, query: ListExpensesQuery) {
    return this.listInternal(companyId, { ...query, employeeId });
  }

  async listDistinctCategories(companyId: string) {
    const rows = await prisma.expense.findMany({
      where: { companyId, deletedAt: null },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return rows.map((row) => row.category);
  }

  private async listInternal(companyId: string, query: ListExpensesQuery) {
    const where = buildListWhere(companyId, query);
    const skip = (query.page - 1) * query.limit;
    const [records, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { _count: { select: { attachments: true } } },
        orderBy: resolveOrderBy(query),
        skip,
        take: query.limit,
      }),
      prisma.expense.count({ where }),
    ]);
    return {
      items: records.map((record) => ({
        expense: toExpenseDomain(record),
        attachmentCount: record._count.attachments,
      })),
      total,
    };
  }
}
