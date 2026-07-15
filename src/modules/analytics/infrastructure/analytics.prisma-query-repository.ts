import { prisma } from '../../../database/prisma.client.js';
import { getLogger } from '../../../config/logger.js';
import { assignRanks, roundMoney } from '../../../shared/analytics/analytics-ranking.js';
import type { AnalyticsFilter } from '../domain/analytics-filter.js';
import type {
  AnalyticsQueryRepository,
  CompanyMetricsProjection,
  ExpenseMetricsProjection,
  OrganizationMetricsProjection,
  TransactionMetricsProjection,
  TripMetricsProjection,
  WorkforceMetricsProjection,
} from '../domain/analytics-query.repository.js';
import {
  buildAttendanceWhere,
  buildCashAdvanceWhere,
  buildExpenseWhere,
  buildLeaveWhere,
  buildPayrollWhere,
  buildTransactionWhere,
  buildTripWhere,
  decimalToNumber,
} from './analytics-where-builders.js';

const SLOW_QUERY_MS = 1000;

async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  if (elapsed > SLOW_QUERY_MS) {
    getLogger().warn(
      { event: 'analytics.slow_query', label, elapsedMs: elapsed },
      'Slow analytics query',
    );
  }
  return result;
}

function emptyExpenseMetrics(): ExpenseMetricsProjection {
  return {
    totalExpenses: 0,
    expensesByCategory: [],
    expensesByBranch: [],
    expensesByWarehouse: [],
    expensesByVehicle: [],
    expensesByTrip: [],
    monthlyExpenseTrend: [],
  };
}

export class AnalyticsPrismaQueryRepository implements AnalyticsQueryRepository {
  async getCompanyMetrics(filter: AnalyticsFilter): Promise<CompanyMetricsProjection> {
    return withTiming('company', async () => {
      const transactionWhere = buildTransactionWhere(filter);
      const [
        inbound,
        outbound,
        amountAgg,
        expenseAgg,
        payrollAgg,
        activeEmployees,
        activeTrips,
        activeVehicles,
      ] = await Promise.all([
        prisma.transaction.count({ where: { ...transactionWhere, direction: 'INBOUND' } }),
        prisma.transaction.count({ where: { ...transactionWhere, direction: 'OUTBOUND' } }),
        prisma.transactionItem.aggregate({
          _sum: { total: true },
          where: { transaction: transactionWhere },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: buildExpenseWhere(filter),
        }),
        prisma.payrollRecord.aggregate({
          _sum: { netPay: true },
          where: buildPayrollWhere(filter),
        }),
        prisma.employee.count({
          where: {
            companyId: filter.companyId,
            status: 'ACTIVE',
            ...(filter.includeArchived ? {} : { deletedAt: null }),
            ...(filter.employeeId ? { id: filter.employeeId } : {}),
          },
        }),
        prisma.trip.count({
          where: {
            companyId: filter.companyId,
            status: 'STARTED',
            ...(filter.includeArchived ? {} : { deletedAt: null }),
          },
        }),
        prisma.vehicle.count({
          where: {
            companyId: filter.companyId,
            status: { in: ['AVAILABLE', 'IN_USE'] },
            ...(filter.includeArchived ? {} : { deletedAt: null }),
          },
        }),
      ]);

      const totalTransactionAmount = roundMoney(decimalToNumber(amountAgg._sum.total));
      const totalExpenses = roundMoney(decimalToNumber(expenseAgg._sum.amount));
      const totalPayroll = roundMoney(decimalToNumber(payrollAgg._sum.netPay));
      const netOperationalAmount = roundMoney(
        totalTransactionAmount - totalExpenses - totalPayroll,
      );

      return {
        totalInboundTransactions: inbound,
        totalOutboundTransactions: outbound,
        totalTransactionAmount,
        totalExpenses,
        totalPayroll,
        netOperationalAmount,
        activeEmployees,
        activeTrips,
        activeVehicles,
      };
    });
  }

  async getTransactionMetrics(filter: AnalyticsFilter): Promise<TransactionMetricsProjection> {
    return withTiming('transactions', async () => {
      const transactionWhere = buildTransactionWhere(filter);
      const [
        inbound,
        outbound,
        transactionCount,
        amountAgg,
        materials,
        employees,
        branches,
        warehouses,
      ] = await Promise.all([
        prisma.transaction.count({ where: { ...transactionWhere, direction: 'INBOUND' } }),
        prisma.transaction.count({ where: { ...transactionWhere, direction: 'OUTBOUND' } }),
        prisma.transaction.count({ where: transactionWhere }),
        prisma.transactionItem.aggregate({
          _sum: { total: true },
          where: { transaction: transactionWhere },
        }),
        prisma.transactionItem.groupBy({
          by: ['materialName'],
          _sum: { total: true },
          where: { transaction: transactionWhere },
          orderBy: { _sum: { total: 'desc' } },
          take: filter.rankingLimit,
        }),
        prisma.transactionEmployeeAssignment.groupBy({
          by: ['employeeId'],
          _count: { _all: true },
          where: { transaction: transactionWhere },
          orderBy: { _count: { employeeId: 'desc' } },
          take: filter.rankingLimit,
        }),
        prisma.transaction.groupBy({
          by: ['branchId'],
          _count: { _all: true },
          where: { ...transactionWhere, branchId: { not: null } },
          orderBy: { _count: { branchId: 'desc' } },
          take: filter.rankingLimit,
        }),
        prisma.transaction.groupBy({
          by: ['warehouseId'],
          _count: { _all: true },
          where: { ...transactionWhere, warehouseId: { not: null } },
          orderBy: { _count: { warehouseId: 'desc' } },
          take: filter.rankingLimit,
        }),
      ]);

      const totalTransactionAmount = roundMoney(decimalToNumber(amountAgg._sum.total));
      const averageTransactionValue =
        transactionCount > 0 ? roundMoney(totalTransactionAmount / transactionCount) : 0;

      const employeeIds = employees.map((row) => row.employeeId);
      const branchIds = branches
        .map((row) => row.branchId)
        .filter((id): id is string => id !== null);
      const warehouseIds = warehouses
        .map((row) => row.warehouseId)
        .filter((id): id is string => id !== null);

      const [employeeRecords, branchRecords, warehouseRecords] = await Promise.all([
        employeeIds.length
          ? prisma.employee.findMany({
              where: { id: { in: employeeIds }, companyId: filter.companyId },
              select: { id: true, firstName: true, lastName: true },
            })
          : Promise.resolve([]),
        branchIds.length
          ? prisma.branch.findMany({
              where: { id: { in: branchIds }, companyId: filter.companyId },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
        warehouseIds.length
          ? prisma.warehouse.findMany({
              where: { id: { in: warehouseIds }, companyId: filter.companyId },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
      ]);

      const employeeNameById = new Map(
        employeeRecords.map((e) => [e.id, `${e.firstName} ${e.lastName}`.trim()]),
      );
      const branchNameById = new Map(branchRecords.map((b) => [b.id, b.name]));
      const warehouseNameById = new Map(warehouseRecords.map((w) => [w.id, w.name]));

      return {
        totalInbound: inbound,
        totalOutbound: outbound,
        totalTransactionAmount,
        transactionCount,
        averageTransactionValue,
        topMaterials: assignRanks(
          materials.map((row) => ({
            label: row.materialName,
            value: roundMoney(decimalToNumber(row._sum.total)),
            unit: 'PHP',
          })),
        ),
        mostActiveEmployees: assignRanks(
          employees.map((row) => ({
            id: row.employeeId,
            label: employeeNameById.get(row.employeeId) ?? row.employeeId,
            value: row._count._all,
            unit: 'count',
          })),
        ),
        mostActiveBranches: assignRanks(
          branches
            .filter((row) => row.branchId)
            .map((row) => ({
              id: row.branchId!,
              label: branchNameById.get(row.branchId!) ?? row.branchId!,
              value: row._count._all,
              unit: 'count',
            })),
        ),
        mostActiveWarehouses: assignRanks(
          warehouses
            .filter((row) => row.warehouseId)
            .map((row) => ({
              id: row.warehouseId!,
              label: warehouseNameById.get(row.warehouseId!) ?? row.warehouseId!,
              value: row._count._all,
              unit: 'count',
            })),
        ),
      };
    });
  }

  async getTripMetrics(filter: AnalyticsFilter): Promise<TripMetricsProjection> {
    return withTiming('trips', async () => {
      const tripWhere = buildTripWhere(filter);
      const [
        totalTrips,
        activeTrips,
        completedTrips,
        cancelledTrips,
        completedTripsData,
        vehicleGroups,
        driverGroups,
      ] = await Promise.all([
        prisma.trip.count({ where: tripWhere }),
        prisma.trip.count({
          where: {
            companyId: filter.companyId,
            status: 'STARTED',
            ...(filter.includeArchived ? {} : { deletedAt: null }),
          },
        }),
        prisma.trip.count({
          where: {
            ...tripWhere,
            status: 'COMPLETED',
            actualEnd: { gte: filter.from, lte: filter.to },
          },
        }),
        prisma.trip.count({
          where: {
            companyId: filter.companyId,
            status: 'CANCELLED',
            updatedAt: { gte: filter.from, lte: filter.to },
            ...(filter.includeArchived ? {} : { deletedAt: null }),
          },
        }),
        prisma.trip.findMany({
          where: {
            ...tripWhere,
            status: 'COMPLETED',
            actualStart: { not: null },
            actualEnd: { not: null },
          },
          select: { actualStart: true, actualEnd: true },
        }),
        prisma.trip.groupBy({
          by: ['vehicleId'],
          _count: { _all: true },
          where: tripWhere,
          orderBy: { _count: { vehicleId: 'desc' } },
          take: filter.rankingLimit,
        }),
        prisma.tripMember.groupBy({
          by: ['employeeId'],
          _count: { _all: true },
          where: {
            role: 'DRIVER',
            trip: tripWhere,
          },
          orderBy: { _count: { employeeId: 'desc' } },
          take: filter.rankingLimit,
        }),
      ]);

      const durations = completedTripsData
        .filter((trip) => trip.actualStart && trip.actualEnd)
        .map((trip) => (trip.actualEnd!.getTime() - trip.actualStart!.getTime()) / 60000);
      const averageTripDurationMinutes =
        durations.length > 0
          ? roundMoney(durations.reduce((sum, value) => sum + value, 0) / durations.length)
          : 0;

      const vehicleIds = vehicleGroups.map((row) => row.vehicleId);
      const driverIds = driverGroups.map((row) => row.employeeId);
      const [vehicles, drivers] = await Promise.all([
        vehicleIds.length
          ? prisma.vehicle.findMany({
              where: { id: { in: vehicleIds }, companyId: filter.companyId },
              select: { id: true, plateNumber: true },
            })
          : Promise.resolve([]),
        driverIds.length
          ? prisma.employee.findMany({
              where: { id: { in: driverIds }, companyId: filter.companyId },
              select: { id: true, firstName: true, lastName: true },
            })
          : Promise.resolve([]),
      ]);

      const vehicleLabelById = new Map(vehicles.map((v) => [v.id, v.plateNumber]));
      const driverLabelById = new Map(
        drivers.map((d) => [d.id, `${d.firstName} ${d.lastName}`.trim()]),
      );

      const vehicleUtilization = vehicleGroups.map((row) => ({
        vehicleId: row.vehicleId,
        label: vehicleLabelById.get(row.vehicleId) ?? row.vehicleId,
        tripCount: row._count._all,
        utilizationRate: null,
      }));

      return {
        totalTrips,
        activeTrips,
        completedTrips,
        cancelledTrips,
        averageTripDurationMinutes,
        vehicleUtilization,
        mostActiveVehicles: assignRanks(
          vehicleGroups.map((row) => ({
            id: row.vehicleId,
            label: vehicleLabelById.get(row.vehicleId) ?? row.vehicleId,
            value: row._count._all,
            unit: 'count',
          })),
        ),
        mostActiveDrivers: assignRanks(
          driverGroups.map((row) => ({
            id: row.employeeId,
            label: driverLabelById.get(row.employeeId) ?? row.employeeId,
            value: row._count._all,
            unit: 'count',
          })),
        ),
      };
    });
  }

  async getExpenseMetrics(filter: AnalyticsFilter): Promise<ExpenseMetricsProjection> {
    if (!Object.prototype.hasOwnProperty.call(prisma, 'expense')) {
      return emptyExpenseMetrics();
    }
    return withTiming('expenses', async () => {
      const where = buildExpenseWhere(filter);
      const [totalAgg, byCategory, byBranch, byWarehouse, byVehicle, byTrip, expenses] =
        await Promise.all([
          prisma.expense.aggregate({ _sum: { amount: true }, where }),
          prisma.expense.groupBy({
            by: ['category'],
            where,
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10,
          }),
          prisma.expense.groupBy({
            by: ['branchId'],
            where: { ...where, branchId: { not: null } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10,
          }),
          prisma.expense.groupBy({
            by: ['warehouseId'],
            where: { ...where, warehouseId: { not: null } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10,
          }),
          prisma.expense.groupBy({
            by: ['vehicleId'],
            where: { ...where, vehicleId: { not: null } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10,
          }),
          prisma.expense.groupBy({
            by: ['tripId'],
            where: { ...where, tripId: { not: null } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10,
          }),
          prisma.expense.findMany({
            where,
            select: { expenseDate: true, amount: true },
          }),
        ]);

      const branchIds = byBranch
        .map((row) => row.branchId)
        .filter((id): id is string => Boolean(id));
      const warehouseIds = byWarehouse
        .map((row) => row.warehouseId)
        .filter((id): id is string => Boolean(id));
      const vehicleIds = byVehicle
        .map((row) => row.vehicleId)
        .filter((id): id is string => Boolean(id));
      const tripIds = byTrip.map((row) => row.tripId).filter((id): id is string => Boolean(id));

      const [branches, warehouses, vehicles, trips] = await Promise.all([
        branchIds.length
          ? prisma.branch.findMany({
              where: { id: { in: branchIds } },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
        warehouseIds.length
          ? prisma.warehouse.findMany({
              where: { id: { in: warehouseIds } },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
        vehicleIds.length
          ? prisma.vehicle.findMany({
              where: { id: { in: vehicleIds } },
              select: { id: true, plateNumber: true },
            })
          : Promise.resolve([]),
        tripIds.length
          ? prisma.trip.findMany({
              where: { id: { in: tripIds } },
              select: { id: true, tripNumber: true },
            })
          : Promise.resolve([]),
      ]);

      const branchLabelById = new Map(branches.map((b) => [b.id, b.name]));
      const warehouseLabelById = new Map(warehouses.map((w) => [w.id, w.name]));
      const vehicleLabelById = new Map(vehicles.map((v) => [v.id, v.plateNumber]));
      const tripLabelById = new Map(trips.map((t) => [t.id, t.tripNumber]));

      const monthlyBuckets = new Map<string, number>();
      for (const expense of expenses) {
        const month = expense.expenseDate.toISOString().slice(0, 7);
        monthlyBuckets.set(
          month,
          (monthlyBuckets.get(month) ?? 0) + decimalToNumber(expense.amount),
        );
      }

      return {
        totalExpenses: roundMoney(decimalToNumber(totalAgg._sum.amount)),
        expensesByCategory: assignRanks(
          byCategory.map((row) => ({
            id: row.category,
            label: row.category,
            value: roundMoney(decimalToNumber(row._sum.amount)),
            unit: 'PHP',
          })),
        ),
        expensesByBranch: assignRanks(
          byBranch.map((row) => ({
            id: row.branchId!,
            label: branchLabelById.get(row.branchId!) ?? row.branchId!,
            value: roundMoney(decimalToNumber(row._sum.amount)),
            unit: 'PHP',
          })),
        ),
        expensesByWarehouse: assignRanks(
          byWarehouse.map((row) => ({
            id: row.warehouseId!,
            label: warehouseLabelById.get(row.warehouseId!) ?? row.warehouseId!,
            value: roundMoney(decimalToNumber(row._sum.amount)),
            unit: 'PHP',
          })),
        ),
        expensesByVehicle: assignRanks(
          byVehicle.map((row) => ({
            id: row.vehicleId!,
            label: vehicleLabelById.get(row.vehicleId!) ?? row.vehicleId!,
            value: roundMoney(decimalToNumber(row._sum.amount)),
            unit: 'PHP',
          })),
        ),
        expensesByTrip: assignRanks(
          byTrip.map((row) => ({
            id: row.tripId!,
            label: tripLabelById.get(row.tripId!) ?? row.tripId!,
            value: roundMoney(decimalToNumber(row._sum.amount)),
            unit: 'PHP',
          })),
        ),
        monthlyExpenseTrend: [...monthlyBuckets.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([month, amount]) => ({ month, amount: roundMoney(amount) })),
      };
    });
  }

  async getWorkforceMetrics(filter: AnalyticsFilter): Promise<WorkforceMetricsProjection> {
    return withTiming('workforce', async () => {
      const attendanceWhere = buildAttendanceWhere(filter);
      const [
        sessions,
        openSessions,
        payrollAgg,
        payrollCount,
        leaveRecords,
        cashAdvances,
        assignmentCounts,
        tripMemberCounts,
      ] = await Promise.all([
        prisma.attendanceSession.findMany({
          where: attendanceWhere,
          select: { timeInAt: true, timeOutAt: true, employeeId: true },
        }),
        prisma.attendanceSession.count({
          where: {
            companyId: filter.companyId,
            status: 'OPEN',
            ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
          },
        }),
        prisma.payrollRecord.aggregate({
          _sum: { grossSalary: true, netPay: true },
          where: buildPayrollWhere(filter),
        }),
        prisma.payrollRecord.count({ where: buildPayrollWhere(filter) }),
        prisma.leaveRecord.findMany({
          where: buildLeaveWhere(filter),
          select: { status: true, employeeId: true },
        }),
        prisma.cashAdvance.findMany({
          where: buildCashAdvanceWhere(filter),
          select: { amount: true, deductedAmount: true, status: true, employeeId: true },
        }),
        prisma.transactionEmployeeAssignment.groupBy({
          by: ['employeeId'],
          _count: { _all: true },
          where: { transaction: buildTransactionWhere(filter) },
        }),
        prisma.tripMember.groupBy({
          by: ['employeeId'],
          _count: { _all: true },
          where: { trip: buildTripWhere(filter) },
        }),
      ]);

      const totalHours = roundMoney(
        sessions.reduce((sum, session) => {
          const end = session.timeOutAt ?? filter.to;
          const hours = (end.getTime() - session.timeInAt.getTime()) / 3600000;
          return sum + Math.max(hours, 0);
        }, 0),
      );

      const approvedDays = leaveRecords.filter((record) => record.status === 'APPROVED').length;
      const pendingCount = leaveRecords.filter((record) => record.status === 'PENDING').length;
      const rejectedCount = leaveRecords.filter((record) => record.status === 'REJECTED').length;

      const outstandingTotal = roundMoney(
        cashAdvances
          .filter((advance) => advance.status === 'OUTSTANDING')
          .reduce((sum, advance) => sum + decimalToNumber(advance.amount), 0),
      );
      const deductedTotal = roundMoney(
        cashAdvances.reduce((sum, advance) => sum + decimalToNumber(advance.deductedAmount), 0),
      );

      const activityScores = new Map<string, number>();
      for (const session of sessions) {
        const end = session.timeOutAt ?? filter.to;
        const hours = (end.getTime() - session.timeInAt.getTime()) / 3600000;
        activityScores.set(
          session.employeeId,
          (activityScores.get(session.employeeId) ?? 0) + Math.max(hours, 0),
        );
      }
      for (const row of assignmentCounts) {
        activityScores.set(
          row.employeeId,
          (activityScores.get(row.employeeId) ?? 0) + row._count._all,
        );
      }
      for (const row of tripMemberCounts) {
        activityScores.set(
          row.employeeId,
          (activityScores.get(row.employeeId) ?? 0) + row._count._all,
        );
      }

      const employeeIds = [...activityScores.keys()];
      const employees = employeeIds.length
        ? await prisma.employee.findMany({
            where: { id: { in: employeeIds }, companyId: filter.companyId },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];
      const employeeLabelById = new Map(
        employees.map((employee) => [
          employee.id,
          `${employee.firstName} ${employee.lastName}`.trim(),
        ]),
      );

      const employeeActivity = employeeIds.map((employeeId) => ({
        employeeId,
        label: employeeLabelById.get(employeeId) ?? employeeId,
        activityScore: roundMoney(activityScores.get(employeeId) ?? 0),
      }));

      return {
        attendanceSummary: {
          sessionsCount: sessions.length,
          totalHours,
          openSessions,
        },
        payrollSummary: {
          recordsCount: payrollCount,
          totalGross: roundMoney(decimalToNumber(payrollAgg._sum.grossSalary)),
          totalNetPay: roundMoney(decimalToNumber(payrollAgg._sum.netPay)),
        },
        leaveSummary: {
          approvedDays,
          pendingCount,
          rejectedCount,
        },
        cashAdvanceSummary: {
          outstandingTotal,
          advancesCount: cashAdvances.length,
          deductedTotal,
        },
        employeeActivity,
        mostActiveEmployees: assignRanks(
          employeeActivity.map((item) => ({
            id: item.employeeId,
            label: item.label,
            value: item.activityScore,
            unit: 'score',
          })),
        ).slice(0, filter.rankingLimit),
      };
    });
  }

  async getOrganizationMetrics(filter: AnalyticsFilter): Promise<OrganizationMetricsProjection> {
    return withTiming('organization', async () => {
      const transactionWhere = buildTransactionWhere(filter);
      const tripWhere = buildTripWhere(filter);

      const [branchGroups, warehouseGroups, vehicleGroups, branches, warehouses, vehicles] =
        await Promise.all([
          prisma.transaction.groupBy({
            by: ['branchId'],
            _count: { _all: true },
            where: { ...transactionWhere, branchId: { not: null } },
          }),
          prisma.transaction.groupBy({
            by: ['warehouseId'],
            _count: { _all: true },
            where: { ...transactionWhere, warehouseId: { not: null } },
          }),
          prisma.trip.groupBy({
            by: ['vehicleId'],
            _count: { _all: true },
            where: tripWhere,
          }),
          prisma.branch.findMany({
            where: {
              companyId: filter.companyId,
              ...(filter.includeArchived ? {} : { deletedAt: null }),
            },
            select: { id: true, name: true },
          }),
          prisma.warehouse.findMany({
            where: {
              companyId: filter.companyId,
              ...(filter.includeArchived ? {} : { deletedAt: null }),
            },
            select: { id: true, name: true },
          }),
          prisma.vehicle.findMany({
            where: {
              companyId: filter.companyId,
              ...(filter.includeArchived ? {} : { deletedAt: null }),
            },
            select: { id: true, plateNumber: true },
          }),
        ]);

      const branchCountById = new Map(
        branchGroups.filter((row) => row.branchId).map((row) => [row.branchId!, row._count._all]),
      );
      const warehouseCountById = new Map(
        warehouseGroups
          .filter((row) => row.warehouseId)
          .map((row) => [row.warehouseId!, row._count._all]),
      );
      const vehicleTripCountById = new Map(
        vehicleGroups.map((row) => [row.vehicleId, row._count._all]),
      );

      const branchAmounts = await Promise.all(
        branches.map(async (branch) => {
          const agg = await prisma.transactionItem.aggregate({
            _sum: { total: true },
            where: {
              transaction: { ...transactionWhere, branchId: branch.id },
            },
          });
          return {
            branchId: branch.id,
            label: branch.name,
            transactionCount: branchCountById.get(branch.id) ?? 0,
            transactionAmount: roundMoney(decimalToNumber(agg._sum.total)),
            expenseAmount: 0,
          };
        }),
      );

      const warehousePerformance = await Promise.all(
        warehouses.map(async (warehouse) => {
          const agg = await prisma.transactionItem.aggregate({
            _sum: { total: true },
            where: {
              transaction: { ...transactionWhere, warehouseId: warehouse.id },
            },
          });
          return {
            warehouseId: warehouse.id,
            label: warehouse.name,
            transactionCount: warehouseCountById.get(warehouse.id) ?? 0,
            transactionAmount: roundMoney(decimalToNumber(agg._sum.total)),
          };
        }),
      );

      const vehicleUtilization = vehicles.map((vehicle) => ({
        vehicleId: vehicle.id,
        label: vehicle.plateNumber,
        tripCount: vehicleTripCountById.get(vehicle.id) ?? 0,
        utilizationRate: null,
      }));

      return {
        branchPerformance: branchAmounts.sort((a, b) => b.transactionAmount - a.transactionAmount),
        warehousePerformance: warehousePerformance.sort(
          (a, b) => b.transactionAmount - a.transactionAmount,
        ),
        vehicleUtilization: vehicleUtilization.sort((a, b) => b.tripCount - a.tripCount),
      };
    });
  }
}
