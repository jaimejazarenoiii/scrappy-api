import { prisma } from '../../../database/prisma.client.js';
import { getLogger } from '../../../config/logger.js';
import { reportSkip } from '../domain/report-pagination.js';
import type {
  ReportExportQueryParams,
  ReportListResult,
  ReportQueryParams,
  ReportsQueryRepository,
} from '../domain/report-query.repository.js';
import type { ReportSort } from '../domain/report-sort.js';
import {
  buildAttendanceReportWhere,
  buildBranchReportWhere,
  buildCashAdvanceReportWhere,
  buildEmployeeReportWhere,
  buildLeaveReportWhere,
  buildPayrollReportWhere,
  buildTransactionCountForLocationWhere,
  buildTransactionReportWhere,
  buildTripCountForVehicleWhere,
  buildTripReportWhere,
  buildExpenseReportWhere,
  buildVehicleReportWhere,
  buildWarehouseReportWhere,
} from './report-where-builders.js';
import {
  mapAttendanceReportRow,
  mapBranchReportRow,
  mapCashAdvanceReportRow,
  mapEmployeeReportRow,
  mapExpenseReportRow,
  mapLeaveReportRow,
  mapPayrollReportRow,
  mapTransactionReportRow,
  mapTripReportRow,
  mapVehicleReportRow,
  mapWarehouseReportRow,
} from './mappers/report-projection.mapper.js';

const SLOW_QUERY_MS = 1000;

const transactionInclude = {
  items: true,
  assignments: { include: { employee: true } },
  branch: true,
  warehouse: true,
  trip: { select: { tripNumber: true } },
} as const;

async function loadUserEmailMap(
  userIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, email: true },
  });
  return new Map(users.map((user) => [user.id, user.email]));
}

function collectTransactionUserIds(
  records: Array<{
    createdByUserId: string;
    submittedByUserId: string | null;
    paidByUserId: string | null;
  }>,
): Array<string | null | undefined> {
  return records.flatMap((record) => [
    record.createdByUserId,
    record.submittedByUserId,
    record.paidByUserId,
  ]);
}

async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  if (elapsed > SLOW_QUERY_MS) {
    getLogger().warn(
      { event: 'reports.slow_query', label, elapsedMs: elapsed },
      'Slow report query',
    );
  }
  return result;
}

function isExpenseModelAvailable(): boolean {
  return Object.prototype.hasOwnProperty.call(prisma, 'expense');
}

function orderBy<T extends Record<string, 'asc' | 'desc'>>(
  sort: ReportSort,
  map: Record<string, T>,
  fallback: T,
): T[] {
  const primary = map[sort.sortBy] ?? fallback;
  return [primary, { id: sort.sortOrder } as unknown as T];
}

export class ReportsPrismaQueryRepository implements ReportsQueryRepository {
  async listTransactionReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<ReturnType<typeof mapTransactionReportRow>>> {
    return withTiming('transactions.list', async () => {
      const where = buildTransactionReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          transactionDate: { transactionDate: params.sort.sortOrder },
          transactionNumber: { transactionNumber: params.sort.sortOrder },
          createdAt: { createdAt: params.sort.sortOrder },
          partyName: { partyName: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { transactionDate: 'desc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: transactionInclude,
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.transaction.count({ where }),
      ]);
      const userLabels = await loadUserEmailMap(collectTransactionUserIds(records));
      return { items: records.map((record) => mapTransactionReportRow(record, userLabels)), total };
    });
  }

  async countTransactionReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.transaction.count({
      where: buildTransactionReportWhere(params.filter, params.search),
    });
  }

  async batchTransactionReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        transactionDate: { transactionDate: params.sort.sortOrder },
        transactionNumber: { transactionNumber: params.sort.sortOrder },
        createdAt: { createdAt: params.sort.sortOrder },
        partyName: { partyName: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { transactionDate: 'desc' },
    );
    const records = await prisma.transaction.findMany({
      where: buildTransactionReportWhere(params.filter, params.search),
      include: transactionInclude,
      orderBy: orderByClause,
      skip,
      take,
    });
    const userLabels = await loadUserEmailMap(collectTransactionUserIds(records));
    return records.map((record) => mapTransactionReportRow(record, userLabels));
  }

  async listTripReports(params: ReportQueryParams) {
    return withTiming('trips.list', async () => {
      const where = buildTripReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          scheduledStart: { scheduledStart: params.sort.sortOrder },
          tripNumber: { tripNumber: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
          createdAt: { createdAt: params.sort.sortOrder },
        },
        { scheduledStart: 'desc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.trip.findMany({
          where,
          include: { vehicle: true, members: { include: { employee: true } } },
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.trip.count({ where }),
      ]);
      return { items: records.map(mapTripReportRow), total };
    });
  }

  async countTripReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.trip.count({ where: buildTripReportWhere(params.filter, params.search) });
  }

  async batchTripReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        scheduledStart: { scheduledStart: params.sort.sortOrder },
        tripNumber: { tripNumber: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
        createdAt: { createdAt: params.sort.sortOrder },
      },
      { scheduledStart: 'desc' },
    );
    const records = await prisma.trip.findMany({
      where: buildTripReportWhere(params.filter, params.search),
      include: { vehicle: true, members: { include: { employee: true } } },
      orderBy: orderByClause,
      skip,
      take,
    });
    return records.map(mapTripReportRow);
  }

  async listExpenseReports(params: ReportQueryParams) {
    if (!isExpenseModelAvailable()) {
      return { items: [], total: 0 };
    }
    return withTiming('expenses.list', async () => {
      const where = buildExpenseReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          expenseDate: { expenseDate: params.sort.sortOrder },
          amount: { amount: params.sort.sortOrder },
          category: { category: params.sort.sortOrder },
        },
        { expenseDate: 'desc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          include: {
            branch: true,
            warehouse: true,
            vehicle: true,
            trip: true,
          },
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.expense.count({ where }),
      ]);
      const emailMap = await loadUserEmailMap(records.map((r) => r.createdByUserId));
      return {
        items: records.map((record) =>
          mapExpenseReportRow(record, emailMap.get(record.createdByUserId) ?? 'Unknown'),
        ),
        total,
      };
    });
  }

  async countExpenseReports(params: ReportExportQueryParams): Promise<number> {
    if (!isExpenseModelAvailable()) return 0;
    return prisma.expense.count({
      where: buildExpenseReportWhere(params.filter, params.search),
    });
  }

  async batchExpenseReports(params: ReportExportQueryParams, skip: number, take: number) {
    if (!isExpenseModelAvailable()) return [];
    const orderByClause = orderBy(
      params.sort,
      {
        expenseDate: { expenseDate: params.sort.sortOrder },
        amount: { amount: params.sort.sortOrder },
        category: { category: params.sort.sortOrder },
      },
      { expenseDate: 'desc' },
    );
    const records = await prisma.expense.findMany({
      where: buildExpenseReportWhere(params.filter, params.search),
      include: {
        branch: true,
        warehouse: true,
        vehicle: true,
        trip: true,
      },
      orderBy: orderByClause,
      skip,
      take,
    });
    const emailMap = await loadUserEmailMap(records.map((r) => r.createdByUserId));
    return records.map((record) =>
      mapExpenseReportRow(record, emailMap.get(record.createdByUserId) ?? 'Unknown'),
    );
  }

  async listAttendanceReports(params: ReportQueryParams) {
    return withTiming('attendance.list', async () => {
      const where = buildAttendanceReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          timeInAt: { timeInAt: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { timeInAt: 'desc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.attendanceSession.findMany({
          where,
          include: { employee: true },
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.attendanceSession.count({ where }),
      ]);
      return { items: records.map(mapAttendanceReportRow), total };
    });
  }

  async countAttendanceReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.attendanceSession.count({
      where: buildAttendanceReportWhere(params.filter, params.search),
    });
  }

  async batchAttendanceReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        timeInAt: { timeInAt: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { timeInAt: 'desc' },
    );
    const records = await prisma.attendanceSession.findMany({
      where: buildAttendanceReportWhere(params.filter, params.search),
      include: { employee: true },
      orderBy: orderByClause,
      skip,
      take,
    });
    return records.map(mapAttendanceReportRow);
  }

  async listLeaveReports(params: ReportQueryParams) {
    return withTiming('leave.list', async () => {
      const where = buildLeaveReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          leaveDate: { leaveDate: params.sort.sortOrder },
          leaveType: { leaveType: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { leaveDate: 'desc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.leaveRecord.findMany({
          where,
          include: { employee: true },
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.leaveRecord.count({ where }),
      ]);
      return { items: records.map(mapLeaveReportRow), total };
    });
  }

  async countLeaveReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.leaveRecord.count({ where: buildLeaveReportWhere(params.filter, params.search) });
  }

  async batchLeaveReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        leaveDate: { leaveDate: params.sort.sortOrder },
        leaveType: { leaveType: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { leaveDate: 'desc' },
    );
    const records = await prisma.leaveRecord.findMany({
      where: buildLeaveReportWhere(params.filter, params.search),
      include: { employee: true },
      orderBy: orderByClause,
      skip,
      take,
    });
    return records.map(mapLeaveReportRow);
  }

  async listCashAdvanceReports(params: ReportQueryParams) {
    return withTiming('cash-advances.list', async () => {
      const where = buildCashAdvanceReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          createdAt: { createdAt: params.sort.sortOrder },
          issuedAt: { issuedAt: params.sort.sortOrder },
          amount: { amount: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { issuedAt: 'desc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.cashAdvance.findMany({
          where,
          include: { employee: true },
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.cashAdvance.count({ where }),
      ]);
      const userLabels = await loadUserEmailMap(records.map((record) => record.createdByUserId));
      return { items: records.map((record) => mapCashAdvanceReportRow(record, userLabels)), total };
    });
  }

  async countCashAdvanceReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.cashAdvance.count({
      where: buildCashAdvanceReportWhere(params.filter, params.search),
    });
  }

  async batchCashAdvanceReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        createdAt: { createdAt: params.sort.sortOrder },
        issuedAt: { issuedAt: params.sort.sortOrder },
        amount: { amount: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { issuedAt: 'desc' },
    );
    const records = await prisma.cashAdvance.findMany({
      where: buildCashAdvanceReportWhere(params.filter, params.search),
      include: { employee: true },
      orderBy: orderByClause,
      skip,
      take,
    });
    const userLabels = await loadUserEmailMap(records.map((record) => record.createdByUserId));
    return records.map((record) => mapCashAdvanceReportRow(record, userLabels));
  }

  async listPayrollReports(params: ReportQueryParams) {
    return withTiming('payroll.list', async () => {
      const where = buildPayrollReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          payPeriodStart: { payPeriodStart: params.sort.sortOrder },
          payPeriodEnd: { payPeriodEnd: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { payPeriodStart: 'desc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.payrollRecord.findMany({
          where,
          include: { employee: true },
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.payrollRecord.count({ where }),
      ]);
      const userLabels = await loadUserEmailMap(records.map((record) => record.updatedByUserId));
      return { items: records.map((record) => mapPayrollReportRow(record, userLabels)), total };
    });
  }

  async countPayrollReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.payrollRecord.count({
      where: buildPayrollReportWhere(params.filter, params.search),
    });
  }

  async batchPayrollReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        payPeriodStart: { payPeriodStart: params.sort.sortOrder },
        payPeriodEnd: { payPeriodEnd: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { payPeriodStart: 'desc' },
    );
    const records = await prisma.payrollRecord.findMany({
      where: buildPayrollReportWhere(params.filter, params.search),
      include: { employee: true },
      orderBy: orderByClause,
      skip,
      take,
    });
    const userLabels = await loadUserEmailMap(records.map((record) => record.updatedByUserId));
    return records.map((record) => mapPayrollReportRow(record, userLabels));
  }

  async listEmployeeReports(params: ReportQueryParams) {
    return withTiming('employees.list', async () => {
      const where = buildEmployeeReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          lastName: { lastName: params.sort.sortOrder },
          firstName: { firstName: params.sort.sortOrder },
          createdAt: { createdAt: params.sort.sortOrder },
          employeeNumber: { employeeNumber: params.sort.sortOrder },
        },
        { lastName: 'asc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          include: { user: { select: { email: true } } },
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.employee.count({ where }),
      ]);
      return { items: records.map(mapEmployeeReportRow), total };
    });
  }

  async countEmployeeReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.employee.count({
      where: buildEmployeeReportWhere(params.filter, params.search),
    });
  }

  async batchEmployeeReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        lastName: { lastName: params.sort.sortOrder },
        firstName: { firstName: params.sort.sortOrder },
        createdAt: { createdAt: params.sort.sortOrder },
        employeeNumber: { employeeNumber: params.sort.sortOrder },
      },
      { lastName: 'asc' },
    );
    const records = await prisma.employee.findMany({
      where: buildEmployeeReportWhere(params.filter, params.search),
      include: { user: { select: { email: true } } },
      orderBy: orderByClause,
      skip,
      take,
    });
    return records.map(mapEmployeeReportRow);
  }

  async listBranchReports(params: ReportQueryParams) {
    return withTiming('branches.list', async () => {
      const where = buildBranchReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          name: { name: params.sort.sortOrder },
          createdAt: { createdAt: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { name: 'asc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.branch.findMany({
          where,
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.branch.count({ where }),
      ]);
      const hasPeriod = Boolean(params.filter.from && params.filter.to);
      const items = await Promise.all(
        records.map(async (record) => {
          const count = hasPeriod
            ? await prisma.transaction.count({
                where: buildTransactionCountForLocationWhere(params.filter, record.id),
              })
            : null;
          return mapBranchReportRow(record, count);
        }),
      );
      return { items, total };
    });
  }

  async countBranchReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.branch.count({ where: buildBranchReportWhere(params.filter, params.search) });
  }

  async batchBranchReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        name: { name: params.sort.sortOrder },
        createdAt: { createdAt: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { name: 'asc' },
    );
    const records = await prisma.branch.findMany({
      where: buildBranchReportWhere(params.filter, params.search),
      orderBy: orderByClause,
      skip,
      take,
    });
    const hasPeriod = Boolean(params.filter.from && params.filter.to);
    return Promise.all(
      records.map(async (record) => {
        const count = hasPeriod
          ? await prisma.transaction.count({
              where: buildTransactionCountForLocationWhere(params.filter, record.id),
            })
          : null;
        return mapBranchReportRow(record, count);
      }),
    );
  }

  async listWarehouseReports(params: ReportQueryParams) {
    return withTiming('warehouses.list', async () => {
      const where = buildWarehouseReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          name: { name: params.sort.sortOrder },
          createdAt: { createdAt: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { name: 'asc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.warehouse.findMany({
          where,
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.warehouse.count({ where }),
      ]);
      const hasPeriod = Boolean(params.filter.from && params.filter.to);
      const items = await Promise.all(
        records.map(async (record) => {
          const count = hasPeriod
            ? await prisma.transaction.count({
                where: buildTransactionCountForLocationWhere(params.filter, undefined, record.id),
              })
            : null;
          return mapWarehouseReportRow(record, count);
        }),
      );
      return { items, total };
    });
  }

  async countWarehouseReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.warehouse.count({
      where: buildWarehouseReportWhere(params.filter, params.search),
    });
  }

  async batchWarehouseReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        name: { name: params.sort.sortOrder },
        createdAt: { createdAt: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { name: 'asc' },
    );
    const records = await prisma.warehouse.findMany({
      where: buildWarehouseReportWhere(params.filter, params.search),
      orderBy: orderByClause,
      skip,
      take,
    });
    const hasPeriod = Boolean(params.filter.from && params.filter.to);
    return Promise.all(
      records.map(async (record) => {
        const count = hasPeriod
          ? await prisma.transaction.count({
              where: buildTransactionCountForLocationWhere(params.filter, undefined, record.id),
            })
          : null;
        return mapWarehouseReportRow(record, count);
      }),
    );
  }

  async listVehicleReports(params: ReportQueryParams) {
    return withTiming('vehicles.list', async () => {
      const where = buildVehicleReportWhere(params.filter, params.search);
      const orderByClause = orderBy(
        params.sort,
        {
          plateNumber: { plateNumber: params.sort.sortOrder },
          createdAt: { createdAt: params.sort.sortOrder },
          status: { status: params.sort.sortOrder },
        },
        { plateNumber: 'asc' },
      );
      const skip = reportSkip(params.pagination);
      const [records, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          orderBy: orderByClause,
          skip,
          take: params.pagination.limit,
        }),
        prisma.vehicle.count({ where }),
      ]);
      const hasPeriod = Boolean(params.filter.from && params.filter.to);
      const items = await Promise.all(
        records.map(async (record) => {
          const count = hasPeriod
            ? await prisma.trip.count({
                where: buildTripCountForVehicleWhere(params.filter, record.id),
              })
            : null;
          return mapVehicleReportRow(record, count);
        }),
      );
      return { items, total };
    });
  }

  async countVehicleReports(params: ReportExportQueryParams): Promise<number> {
    return prisma.vehicle.count({ where: buildVehicleReportWhere(params.filter, params.search) });
  }

  async batchVehicleReports(params: ReportExportQueryParams, skip: number, take: number) {
    const orderByClause = orderBy(
      params.sort,
      {
        plateNumber: { plateNumber: params.sort.sortOrder },
        createdAt: { createdAt: params.sort.sortOrder },
        status: { status: params.sort.sortOrder },
      },
      { plateNumber: 'asc' },
    );
    const records = await prisma.vehicle.findMany({
      where: buildVehicleReportWhere(params.filter, params.search),
      orderBy: orderByClause,
      skip,
      take,
    });
    const hasPeriod = Boolean(params.filter.from && params.filter.to);
    return Promise.all(
      records.map(async (record) => {
        const count = hasPeriod
          ? await prisma.trip.count({
              where: buildTripCountForVehicleWhere(params.filter, record.id),
            })
          : null;
        return mapVehicleReportRow(record, count);
      }),
    );
  }
}
