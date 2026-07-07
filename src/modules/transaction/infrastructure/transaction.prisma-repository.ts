import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  CancelTransactionInput,
  CreateTransactionInput,
  ListTransactionsQuery,
  ListTransactionsResult,
  TransactionDetail,
  TransactionRepository,
  UpdateTransactionInput,
} from '../domain/transaction.repository.js';
import { toTransactionDomain } from './mappers/transaction.mapper.js';
import { toTransactionItemDomain } from './mappers/transaction-item.mapper.js';
import { toTransactionAttachmentDomain } from './mappers/transaction-attachment.mapper.js';

type TransactionWithChildren = Prisma.TransactionGetPayload<{
  include: { items: true; attachments: true; assignments: true };
}>;

function toDetail(record: TransactionWithChildren): TransactionDetail {
  return {
    transaction: toTransactionDomain(record),
    items: record.items.map(toTransactionItemDomain),
    attachments: record.attachments.map(toTransactionAttachmentDomain),
    assignments: record.assignments.map((assignment) => ({
      transactionId: assignment.transactionId,
      employeeId: assignment.employeeId,
      assignedAt: assignment.assignedAt,
    })),
  };
}

function buildListWhere(
  companyId: string,
  query: ListTransactionsQuery,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { companyId };
  if (!query.includeArchived) where.deletedAt = null;
  if (query.direction) where.direction = query.direction;
  if (query.status) where.status = query.status;
  if (query.locationType) where.locationType = query.locationType;
  if (query.branchId) where.branchId = query.branchId;
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.fromDate || query.toDate) {
    where.transactionDate = {};
    if (query.fromDate) where.transactionDate.gte = query.fromDate;
    if (query.toDate) where.transactionDate.lte = query.toDate;
  }
  if (query.search) {
    where.OR = [
      { partyName: { contains: query.search, mode: 'insensitive' } },
      { outsideLocationName: { contains: query.search, mode: 'insensitive' } },
      { notes: { contains: query.search, mode: 'insensitive' } },
      { items: { some: { materialName: { contains: query.search, mode: 'insensitive' } } } },
    ];
  }
  return where;
}

function resolveOrderBy(query: ListTransactionsQuery): Prisma.TransactionOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'transactionDate';
  const sortOrder = query.sortOrder ?? 'desc';
  return { [sortBy]: sortOrder };
}

const summaryInclude = {
  items: { select: { total: true } },
  assignments: { select: { employeeId: true } },
} satisfies Prisma.TransactionInclude;

type TransactionSummaryRecord = Prisma.TransactionGetPayload<{ include: typeof summaryInclude }>;

function toSummaryRow(record: TransactionSummaryRecord) {
  const totalAmount = record.items.reduce((sum, item) => sum + Number(item.total), 0);
  return {
    transaction: toTransactionDomain(record),
    itemCount: record.items.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    assignedEmployeeIds: record.assignments.map((assignment) => assignment.employeeId),
  };
}

export class TransactionPrismaRepository implements TransactionRepository {
  async create(input: CreateTransactionInput): Promise<TransactionDetail> {
    const record = await prisma.transaction.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        createdByUserId: input.createdByUserId,
        direction: input.direction,
        partyName: input.partyName,
        partyContactNumber: input.partyContactNumber ?? null,
        transactionDate: input.transactionDate,
        locationType: input.locationType,
        branchId: input.branchId ?? null,
        warehouseId: input.warehouseId ?? null,
        outsideLocationName: input.outsideLocationName ?? null,
        outsideAddress: input.outsideAddress ?? null,
        tripId: input.tripId ?? null,
        notes: input.notes ?? null,
        items: {
          create: input.items.map((item) => ({
            id: item.id,
            materialName: item.materialName,
            weight: item.weight,
            unit: item.unit,
            price: item.price,
            total: item.total,
            notes: item.notes ?? null,
          })),
        },
        assignments: {
          create: input.assignedEmployeeIds.map((employeeId) => ({ employeeId })),
        },
      },
      include: { items: true, attachments: true, assignments: true },
    });
    return toDetail(record);
  }

  async findById(transactionId: string, companyId: string) {
    const record = await prisma.transaction.findFirst({
      where: { id: transactionId, companyId, deletedAt: null },
    });
    return record ? toTransactionDomain(record) : null;
  }

  async findByIdIncludingArchived(transactionId: string, companyId: string) {
    const record = await prisma.transaction.findFirst({
      where: { id: transactionId, companyId },
    });
    return record ? toTransactionDomain(record) : null;
  }

  async findDetailById(
    transactionId: string,
    companyId: string,
    options?: { includeArchived?: boolean },
  ): Promise<TransactionDetail | null> {
    const record = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        companyId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
      include: { items: true, attachments: true, assignments: true },
    });
    return record ? toDetail(record) : null;
  }

  async update(
    transactionId: string,
    companyId: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionDetail> {
    const existing = await this.findById(transactionId, companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');

    const data: Prisma.TransactionUncheckedUpdateInput = {
      updatedByUserId: input.updatedByUserId ?? null,
    };
    if (input.direction !== undefined) data.direction = input.direction;
    if (input.partyName !== undefined) data.partyName = input.partyName;
    if (input.partyContactNumber !== undefined) data.partyContactNumber = input.partyContactNumber;
    if (input.transactionDate !== undefined) data.transactionDate = input.transactionDate;
    if (input.locationType !== undefined) data.locationType = input.locationType;
    if (input.branchId !== undefined) data.branchId = input.branchId;
    if (input.warehouseId !== undefined) data.warehouseId = input.warehouseId;
    if (input.outsideLocationName !== undefined)
      data.outsideLocationName = input.outsideLocationName;
    if (input.outsideAddress !== undefined) data.outsideAddress = input.outsideAddress;
    if (input.tripId !== undefined) data.tripId = input.tripId;
    if (input.notes !== undefined) data.notes = input.notes;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({ where: { id: transactionId }, data });
      if (input.assignedEmployeeIds) {
        await tx.transactionEmployeeAssignment.deleteMany({ where: { transactionId } });
        await tx.transactionEmployeeAssignment.createMany({
          data: input.assignedEmployeeIds.map((employeeId) => ({ transactionId, employeeId })),
        });
      }
    });

    const detail = await this.findDetailById(transactionId, companyId, { includeArchived: true });
    if (!detail) throw new ResourceNotFoundError('Transaction not found');
    return detail;
  }

  async cancel(transactionId: string, companyId: string, input: CancelTransactionInput) {
    const existing = await this.findById(transactionId, companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');
    const record = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: input.cancellationReason ?? null,
        updatedByUserId: input.updatedByUserId ?? null,
      },
    });
    return toTransactionDomain(record);
  }

  async archive(transactionId: string, companyId: string) {
    const existing = await this.findById(transactionId, companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');
    const record = await prisma.transaction.update({
      where: { id: transactionId },
      data: { deletedAt: new Date() },
    });
    return toTransactionDomain(record);
  }

  async isEmployeeAssigned(transactionId: string, employeeId: string): Promise<boolean> {
    const count = await prisma.transactionEmployeeAssignment.count({
      where: { transactionId, employeeId },
    });
    return count > 0;
  }

  async listByCompany(
    companyId: string,
    query: ListTransactionsQuery,
  ): Promise<ListTransactionsResult> {
    const where = buildListWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: summaryInclude,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items: records.map(toSummaryRow), total };
  }

  async listAssigned(
    companyId: string,
    employeeId: string,
    query: ListTransactionsQuery,
  ): Promise<ListTransactionsResult> {
    const where: Prisma.TransactionWhereInput = {
      ...buildListWhere(companyId, query),
      assignments: { some: { employeeId } },
    };
    const [records, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: summaryInclude,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items: records.map(toSummaryRow), total };
  }
}
