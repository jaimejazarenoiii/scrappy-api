import { roundMoney } from '../../../../shared/analytics/analytics-ranking.js';
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

export function decimalToNumber(
  value: { toNumber?: () => number } | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
}

export function buildEmployeeDisplayName(parts: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}): string {
  return [parts.firstName, parts.middleName, parts.lastName, parts.suffix]
    .filter(Boolean)
    .join(' ');
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type UserLabelSource = { email: string } | null | undefined;

export function resolveUserLabel(user: UserLabelSource): string {
  return user?.email ?? 'Unknown';
}

type TransactionRecord = {
  id: string;
  transactionNumber: string;
  direction: string;
  status: string;
  partyName: string;
  partyContactNumber: string | null;
  transactionDate: Date;
  locationType: string;
  branchId: string | null;
  warehouseId: string | null;
  outsideLocationName: string | null;
  submittedAt: Date | null;
  paidAt: Date | null;
  paymentReference?: string | null;
  createdAt: Date;
  createdByUserId: string;
  submittedByUserId: string | null;
  paidByUserId: string | null;
  branch: { name: string } | null;
  warehouse: { name: string } | null;
  trip: { tripNumber: string } | null;
  items: Array<{
    materialName: string;
    weight: { toNumber?: () => number } | number;
    unit: string;
    price: { toNumber?: () => number } | number;
    total: { toNumber?: () => number } | number;
  }>;
  assignments: Array<{
    employee: {
      firstName: string;
      middleName: string | null;
      lastName: string;
      suffix: string | null;
    };
  }>;
};

export function mapTransactionReportRow(
  record: TransactionRecord,
  userLabels: Map<string, string>,
): TransactionReportRowProjection {
  const items = record.items.map((item) => ({
    materialName: item.materialName,
    weight: decimalToNumber(item.weight),
    unit: item.unit,
    price: roundMoney(decimalToNumber(item.price)),
    total: roundMoney(decimalToNumber(item.total)),
  }));
  const grandTotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));

  let locationLabel = 'Outside';
  if (record.locationType === 'BRANCH' && record.branch) {
    locationLabel = record.branch.name;
  } else if (record.locationType === 'WAREHOUSE' && record.warehouse) {
    locationLabel = record.warehouse.name;
  } else if (record.locationType === 'TRIP' && record.trip) {
    locationLabel = record.trip.tripNumber;
  } else if (record.outsideLocationName) {
    locationLabel = record.outsideLocationName;
  }

  return {
    transactionId: record.id,
    transactionNumber: record.transactionNumber,
    direction: record.direction,
    status: record.status,
    partyName: record.partyName,
    partyContactNumber: record.partyContactNumber,
    assignedEmployees: record.assignments.map((a) => buildEmployeeDisplayName(a.employee)),
    location: {
      type: record.locationType,
      label: locationLabel,
      branchId: record.branchId,
      warehouseId: record.warehouseId,
    },
    items,
    grandTotal,
    settlement: {
      submittedAt: record.submittedAt,
      submittedBy: record.submittedByUserId
        ? (userLabels.get(record.submittedByUserId) ?? record.submittedByUserId)
        : null,
      paidAt: record.paidAt,
      paidBy: record.paidByUserId
        ? (userLabels.get(record.paidByUserId) ?? record.paidByUserId)
        : null,
      paymentReference: record.paymentReference ?? null,
    },
    createdBy: userLabels.get(record.createdByUserId) ?? record.createdByUserId,
    createdAt: record.createdAt,
    transactionDate: record.transactionDate,
  };
}

type TripRecord = {
  id: string;
  tripNumber: string;
  status: string;
  scheduledStart: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  origin: string;
  destination: string;
  vehicle: { plateNumber: string; description: string };
  members: Array<{
    role: string;
    employee: {
      firstName: string;
      middleName: string | null;
      lastName: string;
      suffix: string | null;
    };
  }>;
};

export function mapTripReportRow(record: TripRecord): TripReportRowProjection {
  return {
    tripId: record.id,
    tripNumber: record.tripNumber,
    vehicle: {
      plateNumber: record.vehicle.plateNumber,
      description: record.vehicle.description,
    },
    members: record.members.map((member) => ({
      name: buildEmployeeDisplayName(member.employee),
      role: member.role,
    })),
    status: record.status,
    scheduledStart: record.scheduledStart,
    actualStart: record.actualStart,
    actualEnd: record.actualEnd,
    origin: record.origin,
    destination: record.destination,
  };
}

type AttendanceRecord = {
  id: string;
  status: string;
  timeInAt: Date;
  timeOutAt: Date | null;
  adjustedTimeInAt: Date | null;
  adjustedTimeOutAt: Date | null;
  employee: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
  };
};

export function mapAttendanceReportRow(record: AttendanceRecord): AttendanceReportRowProjection {
  const timeIn = record.adjustedTimeInAt ?? record.timeInAt;
  const timeOut = record.adjustedTimeOutAt ?? record.timeOutAt;
  return {
    attendanceId: record.id,
    employee: {
      id: record.employee.id,
      displayName: buildEmployeeDisplayName(record.employee),
    },
    date: formatDateOnly(timeIn),
    timeIn,
    timeOut,
    status: record.status,
  };
}

type LeaveRecord = {
  id: string;
  leaveType: string;
  leaveDate: Date;
  status: string;
  employee: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
  };
};

export function mapLeaveReportRow(record: LeaveRecord): LeaveReportRowProjection {
  return {
    leaveId: record.id,
    employee: {
      id: record.employee.id,
      displayName: buildEmployeeDisplayName(record.employee),
    },
    leaveType: record.leaveType,
    leaveDate: formatDateOnly(record.leaveDate),
    status: record.status,
  };
}

type CashAdvanceRecord = {
  id: string;
  amount: { toNumber?: () => number } | number;
  remainingAmount: { toNumber?: () => number } | number;
  status: string;
  issuedAt: Date;
  createdByUserId: string | null;
  employee: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
  };
};

export function mapCashAdvanceReportRow(
  record: CashAdvanceRecord,
  userLabels: Map<string, string>,
): CashAdvanceReportRowProjection {
  return {
    cashAdvanceId: record.id,
    employee: {
      id: record.employee.id,
      displayName: buildEmployeeDisplayName(record.employee),
    },
    amount: roundMoney(decimalToNumber(record.amount)),
    issuedBy: record.createdByUserId
      ? (userLabels.get(record.createdByUserId) ?? record.createdByUserId)
      : 'Unknown',
    issuedAt: record.issuedAt,
    status: record.status,
    remainingAmount: roundMoney(decimalToNumber(record.remainingAmount)),
  };
}

type PayrollRecord = {
  id: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  grossSalary: { toNumber?: () => number } | number;
  cashAdvanceDeductions: { toNumber?: () => number } | number;
  netPay: { toNumber?: () => number } | number;
  status: string;
  paidAt: Date | null;
  updatedByUserId: string | null;
  employee: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffix: string | null;
  };
};

export function mapPayrollReportRow(
  record: PayrollRecord,
  userLabels: Map<string, string>,
): PayrollReportRowProjection {
  return {
    payrollId: record.id,
    employee: {
      id: record.employee.id,
      displayName: buildEmployeeDisplayName(record.employee),
    },
    payPeriodStart: formatDateOnly(record.payPeriodStart),
    payPeriodEnd: formatDateOnly(record.payPeriodEnd),
    salary: roundMoney(decimalToNumber(record.grossSalary)),
    cashAdvanceDeduction: roundMoney(decimalToNumber(record.cashAdvanceDeductions)),
    totalAmount: roundMoney(decimalToNumber(record.netPay)),
    status: record.status,
    paidBy:
      record.paidAt && record.updatedByUserId
        ? (userLabels.get(record.updatedByUserId) ?? record.updatedByUserId)
        : null,
    paidAt: record.paidAt,
  };
}

type EmployeeRecord = {
  id: string;
  employeeNumber: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  contactNumber: string | null;
  weeklySalary: { toNumber?: () => number } | number;
  status: string;
  createdAt: Date;
  user: { email: string } | null;
};

export function mapEmployeeReportRow(record: EmployeeRecord): EmployeeReportRowProjection {
  return {
    employeeId: record.id,
    employeeNumber: record.employeeNumber,
    firstName: record.firstName,
    middleName: record.middleName,
    lastName: record.lastName,
    suffix: record.suffix,
    displayName: buildEmployeeDisplayName(record),
    contactNumber: record.contactNumber,
    weeklySalary: roundMoney(decimalToNumber(record.weeklySalary)),
    status: record.status,
    linkedUserEmail: record.user?.email ?? null,
    createdAt: record.createdAt,
  };
}

type BranchRecord = {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function mapBranchReportRow(
  record: BranchRecord,
  transactionCountInPeriod: number | null,
): BranchReportRowProjection {
  return {
    branchId: record.id,
    name: record.name,
    address: record.address,
    contactNumber: record.contactNumber,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    transactionCountInPeriod,
  };
}

type WarehouseRecord = BranchRecord;

export function mapWarehouseReportRow(
  record: WarehouseRecord,
  transactionCountInPeriod: number | null,
): WarehouseReportRowProjection {
  return {
    warehouseId: record.id,
    name: record.name,
    address: record.address,
    contactNumber: record.contactNumber,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    transactionCountInPeriod,
  };
}

type VehicleRecord = {
  id: string;
  plateNumber: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function mapVehicleReportRow(
  record: VehicleRecord,
  tripCountInPeriod: number | null,
): VehicleReportRowProjection {
  return {
    vehicleId: record.id,
    plateNumber: record.plateNumber,
    description: record.description,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    tripCountInPeriod,
  };
}

type ExpenseRecord = {
  id: string;
  category: string;
  amount: { toNumber?: () => number } | number;
  contextType: string;
  expenseDate: Date;
  createdByUserId: string;
  branch: { name: string } | null;
  warehouse: { name: string } | null;
  vehicle: { plateNumber: string } | null;
  trip: { tripNumber: string } | null;
};

export function mapExpenseReportRow(
  record: ExpenseRecord,
  addedByEmail: string,
): ExpenseReportRowProjection {
  let reference = 'Company';
  if (record.branch) reference = record.branch.name;
  else if (record.warehouse) reference = record.warehouse.name;
  else if (record.vehicle) reference = record.vehicle.plateNumber;
  else if (record.trip) reference = record.trip.tripNumber;

  return {
    expenseId: record.id,
    category: record.category,
    amount: roundMoney(decimalToNumber(record.amount)),
    referenceType: record.contextType,
    reference,
    addedBy: addedByEmail,
    date: record.expenseDate,
  };
}
