import type { Expense as PrismaExpense } from '@prisma/client';
import { ExpenseEntity } from '../../domain/expense.entity.js';
import type { ExpenseStatus } from '../../domain/expense-status.js';
import type { ExpenseContextType } from '../../domain/expense-context-type.js';

function decimalToNumber(value: { toNumber(): number } | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function toExpenseDomain(record: PrismaExpense): ExpenseEntity {
  return ExpenseEntity.create({
    id: record.id,
    companyId: record.companyId,
    expenseNumber: record.expenseNumber,
    expenseDate: record.expenseDate,
    category: record.category,
    amount: decimalToNumber(record.amount),
    description: record.description,
    status: record.status as ExpenseStatus,
    contextType: record.contextType as ExpenseContextType,
    branchId: record.branchId,
    warehouseId: record.warehouseId,
    vehicleId: record.vehicleId,
    tripId: record.tripId,
    createdByUserId: record.createdByUserId,
    createdByEmployeeId: record.createdByEmployeeId,
    updatedByUserId: record.updatedByUserId,
    recordedByUserId: record.recordedByUserId,
    recordedAt: record.recordedAt,
    cancelledByUserId: record.cancelledByUserId,
    cancelledAt: record.cancelledAt,
    cancellationReason: record.cancellationReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}
