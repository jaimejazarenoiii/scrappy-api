import type { Prisma } from '@prisma/client';
import type { AnalyticsFilter } from '../domain/analytics-filter.js';

export function archivedPredicate(
  includeArchived: boolean,
): { deletedAt: null } | Record<string, never> {
  return includeArchived ? {} : { deletedAt: null };
}

export function buildTransactionWhere(filter: AnalyticsFilter): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    companyId: filter.companyId,
    status: { not: 'CANCELLED' },
    transactionDate: { gte: filter.from, lte: filter.to },
    ...archivedPredicate(filter.includeArchived),
  };
  if (filter.branchId) where.branchId = filter.branchId;
  if (filter.warehouseId) where.warehouseId = filter.warehouseId;
  if (filter.employeeId) {
    where.assignments = { some: { employeeId: filter.employeeId } };
  }
  if (filter.vehicleId) {
    where.trip = { vehicleId: filter.vehicleId };
  }
  return where;
}

export function buildTripWhere(filter: AnalyticsFilter): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = {
    companyId: filter.companyId,
    scheduledStart: { gte: filter.from, lte: filter.to },
    ...archivedPredicate(filter.includeArchived),
  };
  if (filter.vehicleId) where.vehicleId = filter.vehicleId;
  if (filter.employeeId) {
    where.members = { some: { employeeId: filter.employeeId } };
  }
  return where;
}

export function buildEmployeeWhere(filter: AnalyticsFilter): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
  };
  if (filter.employeeId) where.id = filter.employeeId;
  return where;
}

export function buildPayrollWhere(filter: AnalyticsFilter): Prisma.PayrollRecordWhereInput {
  return {
    companyId: filter.companyId,
    payPeriodStart: { lte: filter.to },
    payPeriodEnd: { gte: filter.from },
  };
}

export function buildAttendanceWhere(filter: AnalyticsFilter): Prisma.AttendanceSessionWhereInput {
  const where: Prisma.AttendanceSessionWhereInput = {
    companyId: filter.companyId,
    timeInAt: { gte: filter.from, lte: filter.to },
  };
  if (filter.employeeId) where.employeeId = filter.employeeId;
  return where;
}

export function buildLeaveWhere(filter: AnalyticsFilter): Prisma.LeaveRecordWhereInput {
  const where: Prisma.LeaveRecordWhereInput = {
    companyId: filter.companyId,
    leaveDate: { gte: filter.from, lte: filter.to },
  };
  if (filter.employeeId) where.employeeId = filter.employeeId;
  return where;
}

export function buildCashAdvanceWhere(filter: AnalyticsFilter): Prisma.CashAdvanceWhereInput {
  const where: Prisma.CashAdvanceWhereInput = {
    companyId: filter.companyId,
    createdAt: { gte: filter.from, lte: filter.to },
  };
  if (filter.employeeId) where.employeeId = filter.employeeId;
  return where;
}

export function decimalToNumber(
  value: { toNumber?: () => number } | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}
