import type { ReportExportColumn } from '../../infrastructure/export/report-exporter.interface.js';
import type {
  AttendanceReportRowProjection,
  BranchReportRowProjection,
  CashAdvanceReportRowProjection,
  EmployeeReportRowProjection,
  ExpenseReportRowProjection,
  LeaveReportRowProjection,
  PayrollReportRowProjection,
  TransactionReportRowProjection,
  TripReportRowProjection,
  VehicleReportRowProjection,
  WarehouseReportRowProjection,
} from '../../domain/report-query.repository.js';

function iso(value: Date | null | undefined): string {
  return value ? value.toISOString() : '';
}

export const TRANSACTION_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'transactionNumber', header: 'Transaction #' },
  { key: 'direction', header: 'Direction' },
  { key: 'status', header: 'Status' },
  { key: 'partyName', header: 'Party' },
  { key: 'partyContactNumber', header: 'Contact' },
  { key: 'assignedEmployees', header: 'Assigned Employees' },
  { key: 'location', header: 'Location' },
  { key: 'items', header: 'Items' },
  { key: 'grandTotal', header: 'Grand Total' },
  { key: 'submittedAt', header: 'Submitted At' },
  { key: 'submittedBy', header: 'Submitted By' },
  { key: 'paidAt', header: 'Paid At' },
  { key: 'paidBy', header: 'Paid By' },
  { key: 'paymentReference', header: 'Payment Reference' },
  { key: 'createdBy', header: 'Created By' },
  { key: 'transactionDate', header: 'Transaction Date' },
  { key: 'createdAt', header: 'Created At' },
];

export function mapTransactionExportRow(row: TransactionReportRowProjection): string[] {
  return [
    row.transactionNumber,
    row.direction,
    row.status,
    row.partyName,
    row.partyContactNumber ?? '',
    row.assignedEmployees.join('; '),
    row.location.label,
    JSON.stringify(row.items),
    String(row.grandTotal),
    iso(row.settlement.submittedAt),
    row.settlement.submittedBy ?? '',
    iso(row.settlement.paidAt),
    row.settlement.paidBy ?? '',
    row.settlement.paymentReference ?? '',
    row.createdBy,
    iso(row.transactionDate),
    iso(row.createdAt),
  ];
}

export const TRIP_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'tripNumber', header: 'Trip #' },
  { key: 'plateNumber', header: 'Plate Number' },
  { key: 'vehicleDescription', header: 'Vehicle' },
  { key: 'members', header: 'Members' },
  { key: 'status', header: 'Status' },
  { key: 'scheduledStart', header: 'Scheduled Start' },
  { key: 'actualStart', header: 'Actual Start' },
  { key: 'actualEnd', header: 'Actual End' },
  { key: 'origin', header: 'Origin' },
  { key: 'destination', header: 'Destination' },
];

export function mapTripExportRow(row: TripReportRowProjection): string[] {
  return [
    row.tripNumber,
    row.vehicle.plateNumber,
    row.vehicle.description,
    row.members.map((m) => `${m.name} (${m.role})`).join('; '),
    row.status,
    iso(row.scheduledStart),
    iso(row.actualStart),
    iso(row.actualEnd),
    row.origin,
    row.destination,
  ];
}

export const EXPENSE_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'category', header: 'Category' },
  { key: 'amount', header: 'Amount' },
  { key: 'referenceType', header: 'Reference Type' },
  { key: 'reference', header: 'Reference' },
  { key: 'addedBy', header: 'Added By' },
  { key: 'date', header: 'Date' },
];

export function mapExpenseExportRow(row: ExpenseReportRowProjection): string[] {
  return [
    row.category,
    String(row.amount),
    row.referenceType,
    row.reference,
    row.addedBy,
    iso(row.date),
  ];
}

export const ATTENDANCE_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'employee', header: 'Employee' },
  { key: 'date', header: 'Date' },
  { key: 'timeIn', header: 'Time In' },
  { key: 'timeOut', header: 'Time Out' },
  { key: 'status', header: 'Status' },
];

export function mapAttendanceExportRow(row: AttendanceReportRowProjection): string[] {
  return [row.employee.displayName, row.date, iso(row.timeIn), iso(row.timeOut), row.status];
}

export const LEAVE_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'employee', header: 'Employee' },
  { key: 'leaveType', header: 'Leave Type' },
  { key: 'leaveDate', header: 'Leave Date' },
  { key: 'status', header: 'Status' },
];

export function mapLeaveExportRow(row: LeaveReportRowProjection): string[] {
  return [row.employee.displayName, row.leaveType, row.leaveDate, row.status];
}

export const CASH_ADVANCE_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'employee', header: 'Employee' },
  { key: 'amount', header: 'Amount' },
  { key: 'issuedBy', header: 'Issued By' },
  { key: 'issuedAt', header: 'Issued At' },
  { key: 'status', header: 'Status' },
  { key: 'remainingAmount', header: 'Remaining' },
];

export function mapCashAdvanceExportRow(row: CashAdvanceReportRowProjection): string[] {
  return [
    row.employee.displayName,
    String(row.amount),
    row.issuedBy,
    iso(row.issuedAt),
    row.status,
    String(row.remainingAmount),
  ];
}

export const PAYROLL_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'employee', header: 'Employee' },
  { key: 'payPeriodStart', header: 'Period Start' },
  { key: 'payPeriodEnd', header: 'Period End' },
  { key: 'salary', header: 'Gross Salary' },
  { key: 'cashAdvanceDeduction', header: 'Cash Advance Deduction' },
  { key: 'totalAmount', header: 'Net Pay' },
  { key: 'status', header: 'Status' },
  { key: 'paidBy', header: 'Paid By' },
  { key: 'paidAt', header: 'Paid At' },
];

export function mapPayrollExportRow(row: PayrollReportRowProjection): string[] {
  return [
    row.employee.displayName,
    row.payPeriodStart,
    row.payPeriodEnd,
    String(row.salary),
    String(row.cashAdvanceDeduction),
    String(row.totalAmount),
    row.status,
    row.paidBy ?? '',
    iso(row.paidAt),
  ];
}

export const EMPLOYEE_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'employeeNumber', header: 'Employee #' },
  { key: 'displayName', header: 'Name' },
  { key: 'contactNumber', header: 'Contact' },
  { key: 'weeklySalary', header: 'Weekly Salary' },
  { key: 'status', header: 'Status' },
  { key: 'linkedUserEmail', header: 'Linked Email' },
  { key: 'createdAt', header: 'Created At' },
];

export function mapEmployeeExportRow(row: EmployeeReportRowProjection): string[] {
  return [
    row.employeeNumber ?? '',
    row.displayName,
    row.contactNumber ?? '',
    String(row.weeklySalary),
    row.status,
    row.linkedUserEmail ?? '',
    iso(row.createdAt),
  ];
}

export const BRANCH_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'name', header: 'Name' },
  { key: 'address', header: 'Address' },
  { key: 'contactNumber', header: 'Contact' },
  { key: 'status', header: 'Status' },
  { key: 'transactionCountInPeriod', header: 'Transactions In Period' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'updatedAt', header: 'Updated At' },
];

export function mapBranchExportRow(row: BranchReportRowProjection): string[] {
  return [
    row.name,
    row.address,
    row.contactNumber,
    row.status,
    row.transactionCountInPeriod === null ? '' : String(row.transactionCountInPeriod),
    iso(row.createdAt),
    iso(row.updatedAt),
  ];
}

export const WAREHOUSE_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'name', header: 'Name' },
  { key: 'address', header: 'Address' },
  { key: 'contactNumber', header: 'Contact' },
  { key: 'status', header: 'Status' },
  { key: 'transactionCountInPeriod', header: 'Transactions In Period' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'updatedAt', header: 'Updated At' },
];

export function mapWarehouseExportRow(row: WarehouseReportRowProjection): string[] {
  return [
    row.name,
    row.address,
    row.contactNumber,
    row.status,
    row.transactionCountInPeriod === null ? '' : String(row.transactionCountInPeriod),
    iso(row.createdAt),
    iso(row.updatedAt),
  ];
}

export const VEHICLE_EXPORT_COLUMNS: ReportExportColumn[] = [
  { key: 'plateNumber', header: 'Plate Number' },
  { key: 'description', header: 'Description' },
  { key: 'status', header: 'Status' },
  { key: 'tripCountInPeriod', header: 'Trips In Period' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'updatedAt', header: 'Updated At' },
];

export function mapVehicleExportRow(row: VehicleReportRowProjection): string[] {
  return [
    row.plateNumber,
    row.description,
    row.status,
    row.tripCountInPeriod === null ? '' : String(row.tripCountInPeriod),
    iso(row.createdAt),
    iso(row.updatedAt),
  ];
}
