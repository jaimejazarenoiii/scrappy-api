import type { PayrollRecord as PrismaPayrollRecord } from '@prisma/client';
import { PayrollRecordEntity } from '../../domain/payroll-record.entity.js';

export function toPayrollDomain(record: PrismaPayrollRecord): PayrollRecordEntity {
  return PayrollRecordEntity.create({
    id: record.id,
    companyId: record.companyId,
    employeeId: record.employeeId,
    payPeriodStart: record.payPeriodStart,
    payPeriodEnd: record.payPeriodEnd,
    grossSalary: Number(record.grossSalary),
    cashAdvanceDeductions: Number(record.cashAdvanceDeductions),
    netPay: Number(record.netPay),
    status: record.status,
    paidAt: record.paidAt,
    paymentReference: record.paymentReference,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
