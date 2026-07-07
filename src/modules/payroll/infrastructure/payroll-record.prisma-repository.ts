import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  CreatePayrollRecordInput,
  ListPayrollQuery,
  MarkPayrollPaidInput,
  PayrollRecordRepository,
} from '../domain/payroll-record.repository.js';
import { toPayrollDomain } from './mappers/payroll-record.mapper.js';

function buildWhere(companyId: string, query: ListPayrollQuery): Prisma.PayrollRecordWhereInput {
  const where: Prisma.PayrollRecordWhereInput = { companyId };
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;
  if (query.payPeriodStart) where.payPeriodStart = query.payPeriodStart;
  if (query.payPeriodEnd) where.payPeriodEnd = query.payPeriodEnd;
  return where;
}

function resolveOrderBy(query: ListPayrollQuery): Prisma.PayrollRecordOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'payPeriodStart';
  const sortOrder = query.sortOrder ?? 'desc';
  return { [sortBy]: sortOrder };
}

export class PayrollRecordPrismaRepository implements PayrollRecordRepository {
  async create(input: CreatePayrollRecordInput) {
    const record = await prisma.payrollRecord.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        employeeId: input.employeeId,
        payPeriodStart: input.payPeriodStart,
        payPeriodEnd: input.payPeriodEnd,
        grossSalary: input.grossSalary,
        cashAdvanceDeductions: input.cashAdvanceDeductions,
        netPay: input.netPay,
        createdByUserId: input.createdByUserId ?? null,
      },
    });
    return toPayrollDomain(record);
  }

  async findById(payrollId: string, companyId: string) {
    const record = await prisma.payrollRecord.findFirst({
      where: { id: payrollId, companyId },
    });
    return record ? toPayrollDomain(record) : null;
  }

  async findByEmployeeAndPayPeriod(employeeId: string, companyId: string, payPeriodStart: Date) {
    const record = await prisma.payrollRecord.findFirst({
      where: { employeeId, companyId, payPeriodStart },
    });
    return record ? toPayrollDomain(record) : null;
  }

  async listByEmployee(employeeId: string, companyId: string, query: ListPayrollQuery) {
    const where = buildWhere(companyId, { ...query, employeeId });
    const [records, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.payrollRecord.count({ where }),
    ]);
    return { items: records.map(toPayrollDomain), total };
  }

  async listByCompany(companyId: string, query: ListPayrollQuery) {
    const where = buildWhere(companyId, query);
    const [records, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        orderBy: resolveOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.payrollRecord.count({ where }),
    ]);
    return { items: records.map(toPayrollDomain), total };
  }

  async markPaid(payrollId: string, companyId: string, input: MarkPayrollPaidInput) {
    const existing = await this.findById(payrollId, companyId);
    if (!existing) throw new ResourceNotFoundError('Payroll record not found');

    const record = await prisma.payrollRecord.update({
      where: { id: payrollId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentReference: input.paymentReference ?? null,
        updatedByUserId: input.updatedByUserId ?? null,
      },
    });
    return toPayrollDomain(record);
  }
}
