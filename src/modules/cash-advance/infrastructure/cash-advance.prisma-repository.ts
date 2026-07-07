import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  CashAdvanceRepository,
  CreateCashAdvanceInput,
  ListCashAdvanceQuery,
} from '../domain/cash-advance.repository.js';
import { toCashAdvanceDomain } from './mappers/cash-advance.mapper.js';

function buildWhere(companyId: string, query: ListCashAdvanceQuery): Prisma.CashAdvanceWhereInput {
  const where: Prisma.CashAdvanceWhereInput = { companyId };
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;
  if (query.fromDate || query.toDate) {
    where.createdAt = {};
    if (query.fromDate) where.createdAt.gte = query.fromDate;
    if (query.toDate) where.createdAt.lte = query.toDate;
  }
  return where;
}

function resolveOrderBy(query: ListCashAdvanceQuery): Prisma.CashAdvanceOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'desc';
  return { [sortBy]: sortOrder };
}

export class CashAdvancePrismaRepository implements CashAdvanceRepository {
  async create(input: CreateCashAdvanceInput) {
    const record = await prisma.cashAdvance.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        employeeId: input.employeeId,
        amount: input.amount,
        deductedAmount: 0,
        remainingAmount: input.amount,
        reason: input.reason ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
    });
    return toCashAdvanceDomain(record);
  }

  async findById(cashAdvanceId: string, companyId: string) {
    const record = await prisma.cashAdvance.findFirst({
      where: { id: cashAdvanceId, companyId },
    });
    return record ? toCashAdvanceDomain(record) : null;
  }

  async listByEmployee(employeeId: string, companyId: string, query: ListCashAdvanceQuery) {
    const where = buildWhere(companyId, { ...query, employeeId });
    const [records, total] = await Promise.all([
      prisma.cashAdvance.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.cashAdvance.count({ where }),
    ]);
    return { items: records.map(toCashAdvanceDomain), total };
  }

  async listByCompany(companyId: string, query: ListCashAdvanceQuery) {
    const where = buildWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.cashAdvance.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.cashAdvance.count({ where }),
    ]);
    return { items: records.map(toCashAdvanceDomain), total };
  }

  async sumOutstandingBalance(employeeId: string, companyId: string) {
    const result = await prisma.cashAdvance.aggregate({
      where: { employeeId, companyId, status: 'OUTSTANDING' },
      _sum: { remainingAmount: true },
    });
    return Number(result._sum.remainingAmount ?? 0);
  }

  async listOutstandingByEmployee(employeeId: string, companyId: string) {
    const records = await prisma.cashAdvance.findMany({
      where: { employeeId, companyId, status: 'OUTSTANDING' },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toCashAdvanceDomain);
  }

  async applyDeduction(cashAdvanceId: string, companyId: string, amount: number) {
    const existing = await this.findById(cashAdvanceId, companyId);
    if (!existing) throw new ResourceNotFoundError('Cash advance not found');

    const newDeductedAmount = existing.deductedAmount + amount;
    const newRemainingAmount = existing.remainingAmount - amount;
    const record = await prisma.cashAdvance.update({
      where: { id: cashAdvanceId },
      data: {
        deductedAmount: newDeductedAmount,
        remainingAmount: newRemainingAmount,
        status: newRemainingAmount === 0 ? 'SETTLED' : 'OUTSTANDING',
      },
    });
    return toCashAdvanceDomain(record);
  }
}
