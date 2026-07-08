import type { AnalyticsFilter } from '../domain/analytics-filter.js';
import type { RankedMetricItem } from '../../../shared/analytics/analytics-ranking.js';

export interface CompanyMetricsProjection {
  totalInboundTransactions: number;
  totalOutboundTransactions: number;
  totalTransactionAmount: number;
  totalExpenses: number;
  totalPayroll: number;
  netOperationalAmount: number;
  activeEmployees: number;
  activeTrips: number;
  activeVehicles: number;
}

export interface TransactionMetricsProjection {
  totalInbound: number;
  totalOutbound: number;
  totalTransactionAmount: number;
  transactionCount: number;
  averageTransactionValue: number;
  topMaterials: RankedMetricItem[];
  mostActiveEmployees: RankedMetricItem[];
  mostActiveBranches: RankedMetricItem[];
  mostActiveWarehouses: RankedMetricItem[];
}

export interface TripUtilizationItem {
  vehicleId: string;
  label: string;
  tripCount: number;
  utilizationRate: number | null;
}

export interface TripMetricsProjection {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  averageTripDurationMinutes: number;
  vehicleUtilization: TripUtilizationItem[];
  mostActiveVehicles: RankedMetricItem[];
  mostActiveDrivers: RankedMetricItem[];
}

export interface MonthlyExpenseTrendItem {
  month: string;
  amount: number;
}

export interface ExpenseMetricsProjection {
  totalExpenses: number;
  expensesByCategory: RankedMetricItem[];
  expensesByBranch: RankedMetricItem[];
  expensesByWarehouse: RankedMetricItem[];
  expensesByVehicle: RankedMetricItem[];
  expensesByTrip: RankedMetricItem[];
  monthlyExpenseTrend: MonthlyExpenseTrendItem[];
}

export interface AttendanceSummaryProjection {
  sessionsCount: number;
  totalHours: number;
  openSessions: number;
}

export interface PayrollSummaryProjection {
  recordsCount: number;
  totalGross: number;
  totalNetPay: number;
}

export interface LeaveSummaryProjection {
  approvedDays: number;
  pendingCount: number;
  rejectedCount: number;
}

export interface CashAdvanceSummaryProjection {
  outstandingTotal: number;
  advancesCount: number;
  deductedTotal: number;
}

export interface EmployeeActivityItem {
  employeeId: string;
  label: string;
  activityScore: number;
}

export interface WorkforceMetricsProjection {
  attendanceSummary: AttendanceSummaryProjection;
  payrollSummary: PayrollSummaryProjection;
  leaveSummary: LeaveSummaryProjection;
  cashAdvanceSummary: CashAdvanceSummaryProjection;
  employeeActivity: EmployeeActivityItem[];
  mostActiveEmployees: RankedMetricItem[];
}

export interface BranchPerformanceItem {
  branchId: string;
  label: string;
  transactionCount: number;
  transactionAmount: number;
  expenseAmount: number;
}

export interface WarehousePerformanceItem {
  warehouseId: string;
  label: string;
  transactionCount: number;
  transactionAmount: number;
}

export interface OrganizationVehicleUtilizationItem {
  vehicleId: string;
  label: string;
  tripCount: number;
  utilizationRate: number | null;
}

export interface OrganizationMetricsProjection {
  branchPerformance: BranchPerformanceItem[];
  warehousePerformance: WarehousePerformanceItem[];
  vehicleUtilization: OrganizationVehicleUtilizationItem[];
}

export interface AnalyticsQueryRepository {
  getCompanyMetrics(filter: AnalyticsFilter): Promise<CompanyMetricsProjection>;
  getTransactionMetrics(filter: AnalyticsFilter): Promise<TransactionMetricsProjection>;
  getTripMetrics(filter: AnalyticsFilter): Promise<TripMetricsProjection>;
  getExpenseMetrics(filter: AnalyticsFilter): Promise<ExpenseMetricsProjection>;
  getWorkforceMetrics(filter: AnalyticsFilter): Promise<WorkforceMetricsProjection>;
  getOrganizationMetrics(filter: AnalyticsFilter): Promise<OrganizationMetricsProjection>;
}
