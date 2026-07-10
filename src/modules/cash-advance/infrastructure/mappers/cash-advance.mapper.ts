import type { CashAdvance as PrismaCashAdvance } from '@prisma/client';
import { CashAdvanceEntity } from '../../domain/cash-advance.entity.js';

export function toCashAdvanceDomain(record: PrismaCashAdvance): CashAdvanceEntity {
  return CashAdvanceEntity.create({
    id: record.id,
    companyId: record.companyId,
    employeeId: record.employeeId,
    amount: Number(record.amount),
    deductedAmount: Number(record.deductedAmount),
    remainingAmount: Number(record.remainingAmount),
    status: record.status,
    reason: record.reason,
    issuedAt: record.issuedAt,
    createdByUserId: record.createdByUserId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
