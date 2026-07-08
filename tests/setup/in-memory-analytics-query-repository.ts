import { assignRanks, roundMoney } from '../../src/shared/analytics/analytics-ranking.js';
import type { AnalyticsFilter } from '../../src/modules/analytics/domain/analytics-filter.js';
import type {
  AnalyticsQueryRepository,
  CompanyMetricsProjection,
  ExpenseMetricsProjection,
  OrganizationMetricsProjection,
  TransactionMetricsProjection,
  TripMetricsProjection,
  WorkforceMetricsProjection,
} from '../../src/modules/analytics/domain/analytics-query.repository.js';
import type { InMemoryTransactionStore } from './in-memory-repositories.js';
import type { InMemoryEmployeeRepository } from './in-memory-repositories.js';
import type { InMemoryBranchRepository } from './in-memory-repositories.js';
import type { InMemoryWarehouseRepository } from './in-memory-repositories.js';
import type { InMemoryVehicleRepository } from './in-memory-repositories.js';
import type { InMemoryAttendanceRepository } from './in-memory-repositories.js';
import type { InMemoryPayrollRepository } from './in-memory-repositories.js';
import type { InMemoryLeaveRepository } from './in-memory-repositories.js';
import type { InMemoryCashAdvanceRepository } from './in-memory-repositories.js';

function matchesTransactionFilter(
  store: InMemoryTransactionStore,
  filter: AnalyticsFilter,
  transactionId: string,
): boolean {
  const transaction = store.transactions.get(transactionId);
  if (!transaction) return false;
  const props = transaction.toPrimitives();
  if (props.companyId !== filter.companyId) return false;
  if (!filter.includeArchived && props.deletedAt) return false;
  if (props.status === 'CANCELLED') return false;
  if (props.transactionDate < filter.from || props.transactionDate > filter.to) return false;
  if (filter.branchId && props.branchId !== filter.branchId) return false;
  if (filter.warehouseId && props.warehouseId !== filter.warehouseId) return false;
  if (filter.employeeId) {
    const assigned = store.assignments.some(
      (row) => row.transactionId === transactionId && row.employeeId === filter.employeeId,
    );
    if (!assigned) return false;
  }
  return true;
}

function transactionIdsInScope(store: InMemoryTransactionStore, filter: AnalyticsFilter): string[] {
  return [...store.transactions.values()]
    .map((transaction) => transaction.id)
    .filter((id) => matchesTransactionFilter(store, filter, id));
}

function emptyExpense(): ExpenseMetricsProjection {
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

export class InMemoryAnalyticsQueryRepository implements AnalyticsQueryRepository {
  constructor(
    private readonly transactionStore: InMemoryTransactionStore,
    private readonly employeeRepository: InMemoryEmployeeRepository,
    private readonly branchRepository: InMemoryBranchRepository,
    private readonly warehouseRepository: InMemoryWarehouseRepository,
    private readonly vehicleRepository: InMemoryVehicleRepository,
    private readonly attendanceRepository: InMemoryAttendanceRepository,
    private readonly payrollRepository: InMemoryPayrollRepository,
    private readonly leaveRepository: InMemoryLeaveRepository,
    private readonly cashAdvanceRepository: InMemoryCashAdvanceRepository,
  ) {}

  async getCompanyMetrics(filter: AnalyticsFilter): Promise<CompanyMetricsProjection> {
    const transactionMetrics = await this.getTransactionMetrics(filter);
    const payrollRecords = [...this.payrollRepository.records.values()].filter((record) => {
      const props = record.toPrimitives();
      return (
        props.companyId === filter.companyId &&
        props.payPeriodStart <= filter.to &&
        props.payPeriodEnd >= filter.from
      );
    });
    const totalPayroll = roundMoney(
      payrollRecords.reduce((sum, record) => sum + record.toPrimitives().netPay, 0),
    );
    const activeEmployees = [...this.employeeRepository.employees.values()].filter((employee) => {
      const props = employee.toPrimitives();
      if (props.companyId !== filter.companyId || props.status !== 'ACTIVE') return false;
      if (!filter.includeArchived && props.deletedAt) return false;
      if (filter.employeeId && props.id !== filter.employeeId) return false;
      return true;
    }).length;

    const activeVehicles = [...this.vehicleRepository.vehicles.values()].filter((vehicle) => {
      const props = vehicle.toPrimitives();
      return (
        props.companyId === filter.companyId &&
        (props.status === 'AVAILABLE' || props.status === 'IN_USE') &&
        (filter.includeArchived || !props.deletedAt)
      );
    }).length;

    const totalExpenses = 0;
    const netOperationalAmount = roundMoney(
      transactionMetrics.totalTransactionAmount - totalExpenses - totalPayroll,
    );

    return {
      totalInboundTransactions: transactionMetrics.totalInbound,
      totalOutboundTransactions: transactionMetrics.totalOutbound,
      totalTransactionAmount: transactionMetrics.totalTransactionAmount,
      totalExpenses,
      totalPayroll,
      netOperationalAmount,
      activeEmployees,
      activeTrips: 0,
      activeVehicles,
    };
  }

  async getTransactionMetrics(filter: AnalyticsFilter): Promise<TransactionMetricsProjection> {
    const ids = transactionIdsInScope(this.transactionStore, filter);
    const transactions = ids.map((id) => this.transactionStore.transactions.get(id)!);
    const inbound = transactions.filter((t) => t.toPrimitives().direction === 'INBOUND').length;
    const outbound = transactions.filter((t) => t.toPrimitives().direction === 'OUTBOUND').length;
    const items = [...this.transactionStore.items.values()].filter((item) =>
      ids.includes(item.transactionId),
    );
    const totalTransactionAmount = roundMoney(
      items.reduce((sum, item) => sum + item.toPrimitives().total, 0),
    );
    const transactionCount = transactions.length;
    const averageTransactionValue =
      transactionCount > 0 ? roundMoney(totalTransactionAmount / transactionCount) : 0;

    const materialTotals = new Map<string, number>();
    for (const item of items) {
      const props = item.toPrimitives();
      materialTotals.set(
        props.materialName,
        (materialTotals.get(props.materialName) ?? 0) + props.total,
      );
    }

    const employeeCounts = new Map<string, number>();
    for (const assignment of this.transactionStore.assignments) {
      if (!ids.includes(assignment.transactionId)) continue;
      employeeCounts.set(
        assignment.employeeId,
        (employeeCounts.get(assignment.employeeId) ?? 0) + 1,
      );
    }

    const branchCounts = new Map<string, number>();
    const warehouseCounts = new Map<string, number>();
    for (const transaction of transactions) {
      const props = transaction.toPrimitives();
      if (props.branchId) {
        branchCounts.set(props.branchId, (branchCounts.get(props.branchId) ?? 0) + 1);
      }
      if (props.warehouseId) {
        warehouseCounts.set(props.warehouseId, (warehouseCounts.get(props.warehouseId) ?? 0) + 1);
      }
    }

    const employeeName = async (employeeId: string) => {
      const employee = await this.employeeRepository.findById(employeeId, filter.companyId);
      return employee
        ? `${employee.toPrimitives().firstName} ${employee.toPrimitives().lastName}`.trim()
        : employeeId;
    };

    const topMaterials = assignRanks(
      [...materialTotals.entries()].map(([label, value]) => ({
        label,
        value: roundMoney(value),
        unit: 'PHP',
      })),
    ).slice(0, filter.rankingLimit);

    const mostActiveEmployees = assignRanks(
      await Promise.all(
        [...employeeCounts.entries()].map(async ([id, value]) => ({
          id,
          label: await employeeName(id),
          value,
          unit: 'count',
        })),
      ),
    ).slice(0, filter.rankingLimit);

    const branchName = async (branchId: string) => {
      const branch = await this.branchRepository.findById(branchId, filter.companyId);
      return branch?.toPrimitives().name ?? branchId;
    };

    const warehouseName = async (warehouseId: string) => {
      const warehouse = await this.warehouseRepository.findById(warehouseId, filter.companyId);
      return warehouse?.toPrimitives().name ?? warehouseId;
    };

    return {
      totalInbound: inbound,
      totalOutbound: outbound,
      totalTransactionAmount,
      transactionCount,
      averageTransactionValue,
      topMaterials,
      mostActiveEmployees,
      mostActiveBranches: assignRanks(
        await Promise.all(
          [...branchCounts.entries()].map(async ([id, value]) => ({
            id,
            label: await branchName(id),
            value,
            unit: 'count',
          })),
        ),
      ).slice(0, filter.rankingLimit),
      mostActiveWarehouses: assignRanks(
        await Promise.all(
          [...warehouseCounts.entries()].map(async ([id, value]) => ({
            id,
            label: await warehouseName(id),
            value,
            unit: 'count',
          })),
        ),
      ).slice(0, filter.rankingLimit),
    };
  }

  async getTripMetrics(_filter: AnalyticsFilter): Promise<TripMetricsProjection> {
    return {
      totalTrips: 0,
      activeTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      averageTripDurationMinutes: 0,
      vehicleUtilization: [],
      mostActiveVehicles: [],
      mostActiveDrivers: [],
    };
  }

  async getExpenseMetrics(_filter: AnalyticsFilter): Promise<ExpenseMetricsProjection> {
    return emptyExpense();
  }

  async getWorkforceMetrics(filter: AnalyticsFilter): Promise<WorkforceMetricsProjection> {
    const sessions = [...this.attendanceRepository.sessions.values()].filter((session) => {
      const props = session.toPrimitives();
      if (props.companyId !== filter.companyId) return false;
      if (props.timeInAt < filter.from || props.timeInAt > filter.to) return false;
      if (filter.employeeId && props.employeeId !== filter.employeeId) return false;
      return true;
    });
    const totalHours = roundMoney(
      sessions.reduce((sum, session) => {
        const props = session.toPrimitives();
        const end = props.timeOutAt ?? filter.to;
        return sum + Math.max((end.getTime() - props.timeInAt.getTime()) / 3600000, 0);
      }, 0),
    );
    const openSessions = [...this.attendanceRepository.sessions.values()].filter(
      (session) => session.toPrimitives().companyId === filter.companyId && session.isOpen(),
    ).length;

    const payrollRecords = [...this.payrollRepository.records.values()].filter((record) => {
      const props = record.toPrimitives();
      return (
        props.companyId === filter.companyId &&
        props.payPeriodStart <= filter.to &&
        props.payPeriodEnd >= filter.from
      );
    });

    const leaveRecords = [...this.leaveRepository.records.values()].filter((record) => {
      const props = record.toPrimitives();
      if (props.companyId !== filter.companyId) return false;
      if (props.leaveDate < filter.from || props.leaveDate > filter.to) return false;
      if (filter.employeeId && props.employeeId !== filter.employeeId) return false;
      return true;
    });

    const cashAdvances = [...this.cashAdvanceRepository.advances.values()].filter((advance) => {
      const props = advance.toPrimitives();
      if (props.companyId !== filter.companyId) return false;
      if (props.createdAt < filter.from || props.createdAt > filter.to) return false;
      if (filter.employeeId && props.employeeId !== filter.employeeId) return false;
      return true;
    });

    return {
      attendanceSummary: {
        sessionsCount: sessions.length,
        totalHours,
        openSessions,
      },
      payrollSummary: {
        recordsCount: payrollRecords.length,
        totalGross: roundMoney(
          payrollRecords.reduce((sum, record) => sum + record.toPrimitives().grossSalary, 0),
        ),
        totalNetPay: roundMoney(
          payrollRecords.reduce((sum, record) => sum + record.toPrimitives().netPay, 0),
        ),
      },
      leaveSummary: {
        approvedDays: leaveRecords.filter((record) => record.toPrimitives().status === 'APPROVED')
          .length,
        pendingCount: leaveRecords.filter((record) => record.toPrimitives().status === 'PENDING')
          .length,
        rejectedCount: leaveRecords.filter((record) => record.toPrimitives().status === 'REJECTED')
          .length,
      },
      cashAdvanceSummary: {
        outstandingTotal: roundMoney(
          cashAdvances
            .filter((advance) => advance.toPrimitives().status === 'OUTSTANDING')
            .reduce((sum, advance) => sum + advance.toPrimitives().amount, 0),
        ),
        advancesCount: cashAdvances.length,
        deductedTotal: roundMoney(
          cashAdvances.reduce((sum, advance) => sum + advance.toPrimitives().deductedAmount, 0),
        ),
      },
      employeeActivity: [],
      mostActiveEmployees: [],
    };
  }

  async getOrganizationMetrics(filter: AnalyticsFilter): Promise<OrganizationMetricsProjection> {
    const branches = await this.branchRepository.list(filter.companyId, {
      page: 1,
      limit: 100,
      sortOrder: 'asc',
    });
    const warehouses = await this.warehouseRepository.list(filter.companyId, {
      page: 1,
      limit: 100,
      sortOrder: 'asc',
    });
    const vehicles = await this.vehicleRepository.list(filter.companyId, {
      page: 1,
      limit: 100,
      sortOrder: 'asc',
    });

    const branchPerformance = await Promise.all(
      branches.items.map(async (branch) => {
        const scoped = { ...filter, branchId: branch.id };
        const metrics = await this.getTransactionMetrics(scoped);
        return {
          branchId: branch.id,
          label: branch.toPrimitives().name,
          transactionCount: metrics.transactionCount,
          transactionAmount: metrics.totalTransactionAmount,
          expenseAmount: 0,
        };
      }),
    );

    const warehousePerformance = await Promise.all(
      warehouses.items.map(async (warehouse) => {
        const scoped = { ...filter, warehouseId: warehouse.id };
        const metrics = await this.getTransactionMetrics(scoped);
        return {
          warehouseId: warehouse.id,
          label: warehouse.toPrimitives().name,
          transactionCount: metrics.transactionCount,
          transactionAmount: metrics.totalTransactionAmount,
        };
      }),
    );

    return {
      branchPerformance,
      warehousePerformance,
      vehicleUtilization: vehicles.items.map((vehicle) => ({
        vehicleId: vehicle.id,
        label: vehicle.toPrimitives().plateNumber,
        tripCount: 0,
        utilizationRate: null,
      })),
    };
  }
}
