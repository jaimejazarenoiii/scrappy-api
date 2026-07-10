import type { Prisma } from '@prisma/client';
import type { ReportFilter } from '../domain/report-filter.js';

export function archivedPredicate(
  includeArchived: boolean,
): { deletedAt: null } | Record<string, never> {
  return includeArchived ? {} : { deletedAt: null };
}

function dateRange(
  from: Date | undefined,
  to: Date | undefined,
): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

export function buildTransactionReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
  };

  const range = dateRange(filter.from, filter.to);
  if (range) where.transactionDate = range;

  if (filter.branchId) where.branchId = filter.branchId;
  if (filter.warehouseId) where.warehouseId = filter.warehouseId;
  if (filter.tripId) where.tripId = filter.tripId;
  if (filter.direction) where.direction = filter.direction;
  if (filter.status) where.status = filter.status as Prisma.EnumTransactionStatusFilter;
  if (filter.transactionNumber) {
    where.transactionNumber = {
      startsWith: filter.transactionNumber,
      mode: 'insensitive',
    };
  }
  if (filter.employeeId) {
    where.assignments = { some: { employeeId: filter.employeeId } };
  }
  if (filter.vehicleId) {
    where.trip = { vehicleId: filter.vehicleId };
  }
  if (search) {
    where.OR = [
      { transactionNumber: { contains: search, mode: 'insensitive' } },
      { partyName: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export function buildTripReportWhere(filter: ReportFilter, search?: string): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.scheduledStart = range;
  if (filter.vehicleId) where.vehicleId = filter.vehicleId;
  if (filter.tripId) where.id = filter.tripId;
  if (filter.employeeId) {
    where.members = { some: { employeeId: filter.employeeId } };
  }
  if (search) {
    where.tripNumber = { contains: search, mode: 'insensitive' };
  }
  return where;
}

export function buildExpenseReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {
    companyId: filter.companyId,
    status: (filter.status as Prisma.EnumExpenseStatusFilter | undefined) ?? 'RECORDED',
    ...archivedPredicate(filter.includeArchived),
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.expenseDate = range;
  if (filter.branchId) where.branchId = filter.branchId;
  if (filter.warehouseId) where.warehouseId = filter.warehouseId;
  if (filter.vehicleId) where.vehicleId = filter.vehicleId;
  if (filter.tripId) where.tripId = filter.tripId;
  if (filter.employeeId) where.createdByEmployeeId = filter.employeeId;
  if (filter.category) {
    where.category = { contains: filter.category, mode: 'insensitive' };
  }
  if (filter.referenceType) {
    where.contextType = filter.referenceType as Prisma.EnumExpenseContextTypeFilter;
  }
  if (search) {
    where.OR = [
      { expenseNumber: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export function buildAttendanceReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.AttendanceSessionWhereInput {
  const where: Prisma.AttendanceSessionWhereInput = {
    companyId: filter.companyId,
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.timeInAt = range;
  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (search) {
    where.employee = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ],
    };
  }
  return where;
}

export function buildLeaveReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.LeaveRecordWhereInput {
  const where: Prisma.LeaveRecordWhereInput = {
    companyId: filter.companyId,
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.leaveDate = range;
  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.status) where.status = filter.status as Prisma.EnumLeaveStatusFilter;
  if (search) {
    where.employee = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    };
  }
  return where;
}

export function buildCashAdvanceReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.CashAdvanceWhereInput {
  const where: Prisma.CashAdvanceWhereInput = {
    companyId: filter.companyId,
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.issuedAt = range;
  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.status) where.status = filter.status as Prisma.EnumCashAdvanceStatusFilter;
  if (search) {
    where.employee = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    };
  }
  return where;
}

export function buildPayrollReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.PayrollRecordWhereInput {
  const where: Prisma.PayrollRecordWhereInput = {
    companyId: filter.companyId,
  };
  if (filter.from && filter.to) {
    where.payPeriodStart = { lte: filter.to };
    where.payPeriodEnd = { gte: filter.from };
  }
  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.status) where.status = filter.status as Prisma.EnumPayrollStatusFilter;
  if (search) {
    where.employee = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    };
  }
  return where;
}

export function buildEmployeeReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.createdAt = range;
  if (filter.employeeId) where.id = filter.employeeId;
  if (filter.status) where.status = filter.status as Prisma.EnumEmployeeStatusFilter;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { employeeNumber: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export function buildBranchReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.BranchWhereInput {
  const where: Prisma.BranchWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.createdAt = range;
  if (filter.branchId) where.id = filter.branchId;
  if (filter.status) where.status = filter.status as Prisma.EnumBranchStatusFilter;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  return where;
}

export function buildWarehouseReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.WarehouseWhereInput {
  const where: Prisma.WarehouseWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.createdAt = range;
  if (filter.warehouseId) where.id = filter.warehouseId;
  if (filter.status) where.status = filter.status as Prisma.EnumWarehouseStatusFilter;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  return where;
}

export function buildVehicleReportWhere(
  filter: ReportFilter,
  search?: string,
): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.createdAt = range;
  if (filter.vehicleId) where.id = filter.vehicleId;
  if (filter.status) where.status = filter.status as Prisma.EnumVehicleStatusFilter;
  if (search) {
    where.plateNumber = { contains: search, mode: 'insensitive' };
  }
  return where;
}

export function buildTransactionCountForLocationWhere(
  filter: ReportFilter,
  branchId?: string,
  warehouseId?: string,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    companyId: filter.companyId,
    ...archivedPredicate(filter.includeArchived),
    status: { not: 'CANCELLED' },
  };
  if (branchId) where.branchId = branchId;
  if (warehouseId) where.warehouseId = warehouseId;
  const range = dateRange(filter.from, filter.to);
  if (range) where.transactionDate = range;
  return where;
}

export function buildTripCountForVehicleWhere(
  filter: ReportFilter,
  vehicleId: string,
): Prisma.TripWhereInput {
  const where: Prisma.TripWhereInput = {
    companyId: filter.companyId,
    vehicleId,
    ...archivedPredicate(filter.includeArchived),
  };
  const range = dateRange(filter.from, filter.to);
  if (range) where.scheduledStart = range;
  return where;
}
