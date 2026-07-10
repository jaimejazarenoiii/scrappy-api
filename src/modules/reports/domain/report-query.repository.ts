import type { ReportFilter } from './report-filter.js';
import type { ReportPagination } from './report-pagination.js';
import type { ReportSort } from './report-sort.js';

export interface TransactionReportItemProjection {
  materialName: string;
  weight: number;
  unit: string;
  price: number;
  total: number;
}

export interface TransactionReportLocationProjection {
  type: string;
  label: string;
  branchId: string | null;
  warehouseId: string | null;
}

export interface TransactionReportSettlementProjection {
  submittedAt: Date | null;
  submittedBy: string | null;
  paidAt: Date | null;
  paidBy: string | null;
  paymentReference: string | null;
}

export interface TransactionReportRowProjection {
  transactionId: string;
  transactionNumber: string;
  direction: string;
  status: string;
  partyName: string;
  partyContactNumber: string | null;
  assignedEmployees: string[];
  location: TransactionReportLocationProjection;
  items: TransactionReportItemProjection[];
  grandTotal: number;
  settlement: TransactionReportSettlementProjection;
  createdBy: string;
  createdAt: Date;
  transactionDate: Date;
}

export interface TripReportVehicleProjection {
  plateNumber: string;
  description: string;
}

export interface TripReportMemberProjection {
  name: string;
  role: string;
}

export interface TripReportRowProjection {
  tripId: string;
  tripNumber: string;
  vehicle: TripReportVehicleProjection;
  members: TripReportMemberProjection[];
  status: string;
  scheduledStart: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  origin: string;
  destination: string;
}

export interface ExpenseReportRowProjection {
  expenseId: string;
  category: string;
  amount: number;
  referenceType: string;
  reference: string;
  addedBy: string;
  date: Date;
}

export interface AttendanceReportEmployeeProjection {
  id: string;
  displayName: string;
}

export interface AttendanceReportRowProjection {
  attendanceId: string;
  employee: AttendanceReportEmployeeProjection;
  date: string;
  timeIn: Date;
  timeOut: Date | null;
  status: string;
}

export interface LeaveReportEmployeeProjection {
  id: string;
  displayName: string;
}

export interface LeaveReportRowProjection {
  leaveId: string;
  employee: LeaveReportEmployeeProjection;
  leaveType: string;
  leaveDate: string;
  status: string;
}

export interface CashAdvanceReportEmployeeProjection {
  id: string;
  displayName: string;
}

export interface CashAdvanceReportRowProjection {
  cashAdvanceId: string;
  employee: CashAdvanceReportEmployeeProjection;
  amount: number;
  issuedBy: string;
  issuedAt: Date;
  status: string;
  remainingAmount: number;
}

export interface PayrollReportEmployeeProjection {
  id: string;
  displayName: string;
}

export interface PayrollReportRowProjection {
  payrollId: string;
  employee: PayrollReportEmployeeProjection;
  payPeriodStart: string;
  payPeriodEnd: string;
  salary: number;
  cashAdvanceDeduction: number;
  totalAmount: number;
  status: string;
  paidBy: string | null;
  paidAt: Date | null;
}

export interface EmployeeReportRowProjection {
  employeeId: string;
  employeeNumber: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  displayName: string;
  contactNumber: string | null;
  weeklySalary: number;
  status: string;
  linkedUserEmail: string | null;
  createdAt: Date;
}

export interface BranchReportRowProjection {
  branchId: string;
  name: string;
  address: string;
  contactNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  transactionCountInPeriod: number | null;
}

export interface WarehouseReportRowProjection {
  warehouseId: string;
  name: string;
  address: string;
  contactNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  transactionCountInPeriod: number | null;
}

export interface VehicleReportRowProjection {
  vehicleId: string;
  plateNumber: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tripCountInPeriod: number | null;
}

export interface ReportListResult<T> {
  items: T[];
  total: number;
}

export interface ReportQueryParams {
  filter: ReportFilter;
  search?: string;
  sort: ReportSort;
  pagination: ReportPagination;
}

export interface ReportExportQueryParams {
  filter: ReportFilter;
  search?: string;
  sort: ReportSort;
}

export const REPORT_EXPORT_BATCH_SIZE = 500;
export const REPORT_EXPORT_MAX_ROWS = 10_000;

export interface ReportsQueryRepository {
  listTransactionReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<TransactionReportRowProjection>>;
  countTransactionReports(params: ReportExportQueryParams): Promise<number>;
  batchTransactionReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<TransactionReportRowProjection[]>;

  listTripReports(params: ReportQueryParams): Promise<ReportListResult<TripReportRowProjection>>;
  countTripReports(params: ReportExportQueryParams): Promise<number>;
  batchTripReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<TripReportRowProjection[]>;

  listExpenseReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<ExpenseReportRowProjection>>;
  countExpenseReports(params: ReportExportQueryParams): Promise<number>;
  batchExpenseReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<ExpenseReportRowProjection[]>;

  listAttendanceReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<AttendanceReportRowProjection>>;
  countAttendanceReports(params: ReportExportQueryParams): Promise<number>;
  batchAttendanceReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<AttendanceReportRowProjection[]>;

  listLeaveReports(params: ReportQueryParams): Promise<ReportListResult<LeaveReportRowProjection>>;
  countLeaveReports(params: ReportExportQueryParams): Promise<number>;
  batchLeaveReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<LeaveReportRowProjection[]>;

  listCashAdvanceReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<CashAdvanceReportRowProjection>>;
  countCashAdvanceReports(params: ReportExportQueryParams): Promise<number>;
  batchCashAdvanceReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<CashAdvanceReportRowProjection[]>;

  listPayrollReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<PayrollReportRowProjection>>;
  countPayrollReports(params: ReportExportQueryParams): Promise<number>;
  batchPayrollReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<PayrollReportRowProjection[]>;

  listEmployeeReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<EmployeeReportRowProjection>>;
  countEmployeeReports(params: ReportExportQueryParams): Promise<number>;
  batchEmployeeReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<EmployeeReportRowProjection[]>;

  listBranchReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<BranchReportRowProjection>>;
  countBranchReports(params: ReportExportQueryParams): Promise<number>;
  batchBranchReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<BranchReportRowProjection[]>;

  listWarehouseReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<WarehouseReportRowProjection>>;
  countWarehouseReports(params: ReportExportQueryParams): Promise<number>;
  batchWarehouseReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<WarehouseReportRowProjection[]>;

  listVehicleReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<VehicleReportRowProjection>>;
  countVehicleReports(params: ReportExportQueryParams): Promise<number>;
  batchVehicleReports(
    params: ReportExportQueryParams,
    skip: number,
    take: number,
  ): Promise<VehicleReportRowProjection[]>;
}
