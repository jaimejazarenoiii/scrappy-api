import { roundMoney } from '../../src/shared/analytics/analytics-ranking.js';
import type { ReportFilter } from '../../src/modules/reports/domain/report-filter.js';
import {
  reportSkip,
  type ReportPagination,
} from '../../src/modules/reports/domain/report-pagination.js';
import type { ReportSort, SortOrder } from '../../src/modules/reports/domain/report-sort.js';
import type {
  AttendanceReportRowProjection,
  BranchReportRowProjection,
  CashAdvanceReportRowProjection,
  EmployeeReportRowProjection,
  ExpenseReportRowProjection,
  LeaveReportRowProjection,
  PayrollReportRowProjection,
  ReportExportQueryParams,
  ReportListResult,
  ReportQueryParams,
  ReportsQueryRepository,
  TransactionReportRowProjection,
  TripReportRowProjection,
  VehicleReportRowProjection,
  WarehouseReportRowProjection,
} from '../../src/modules/reports/domain/report-query.repository.js';
import {
  buildEmployeeDisplayName,
  mapAttendanceReportRow,
  mapBranchReportRow,
  mapCashAdvanceReportRow,
  mapEmployeeReportRow,
  mapLeaveReportRow,
  mapPayrollReportRow,
  mapTransactionReportRow,
  mapVehicleReportRow,
  mapWarehouseReportRow,
} from '../../src/modules/reports/infrastructure/mappers/report-projection.mapper.js';
import type {
  InMemoryAttendanceRepository,
  InMemoryBranchRepository,
  InMemoryCashAdvanceRepository,
  InMemoryEmployeeRepository,
  InMemoryLeaveRepository,
  InMemoryPayrollRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
  InMemoryVehicleRepository,
  InMemoryWarehouseRepository,
} from './in-memory-repositories.js';

function matchesArchived(includeArchived: boolean, deletedAt: Date | null): boolean {
  return includeArchived || deletedAt === null;
}

function inDateRange(date: Date, from: Date | undefined, to: Date | undefined): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function compareValues(a: unknown, b: unknown, order: SortOrder): number {
  if (a == null && b == null) return 0;
  if (a == null) return order === 'asc' ? -1 : 1;
  if (b == null) return order === 'asc' ? 1 : -1;
  if (a instanceof Date && b instanceof Date) {
    const diff = a.getTime() - b.getTime();
    return order === 'asc' ? diff : -diff;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    const diff = a - b;
    return order === 'asc' ? diff : -diff;
  }
  const diff = String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
  return order === 'asc' ? diff : -diff;
}

function sortRows<T>(
  rows: T[],
  sort: ReportSort,
  getters: Record<string, (row: T) => unknown>,
  fallbackKey: string,
): T[] {
  const getter = getters[sort.sortBy] ?? getters[fallbackKey];
  return [...rows].sort((left, right) =>
    compareValues(getter(left), getter(right), sort.sortOrder),
  );
}

function paginateRows<T>(rows: T[], pagination: ReportPagination): ReportListResult<T> {
  const skip = reportSkip(pagination);
  return { items: rows.slice(skip, skip + pagination.limit), total: rows.length };
}

function matchesSearch(value: string | null | undefined, search: string): boolean {
  return (value ?? '').toLowerCase().includes(search.toLowerCase());
}

function employeeNameParts(employee: {
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
}) {
  return {
    firstName: employee.firstName,
    middleName: employee.middleName,
    lastName: employee.lastName,
    suffix: employee.suffix,
  };
}

export class InMemoryReportsQueryRepository implements ReportsQueryRepository {
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
    private readonly userRepository: InMemoryUserRepository,
  ) {}

  private loadUserEmailMap(userIds: Array<string | null | undefined>): Map<string, string> {
    const map = new Map<string, string>();
    for (const id of [...new Set(userIds.filter((value): value is string => Boolean(value)))]) {
      const user = [...this.userRepository.users.values()].find((entry) => entry.id === id);
      if (user) map.set(id, user.toPrimitives().email);
    }
    return map;
  }

  private async mapTransactionRow(
    transactionId: string,
  ): Promise<TransactionReportRowProjection | null> {
    const transaction = this.transactionStore.transactions.get(transactionId);
    if (!transaction) return null;
    const props = transaction.toPrimitives();
    const items = [...this.transactionStore.items.values()]
      .filter((item) => item.transactionId === transactionId)
      .map((item) => {
        const itemProps = item.toPrimitives();
        return {
          materialName: itemProps.materialName,
          weight: itemProps.weight,
          unit: itemProps.unit,
          price: itemProps.price,
          total: itemProps.total,
        };
      });
    const assignments = (
      await Promise.all(
        this.transactionStore.assignments
          .filter((assignment) => assignment.transactionId === transactionId)
          .map(async (assignment) => {
            const employee = await this.employeeRepository.findById(
              assignment.employeeId,
              props.companyId,
            );
            if (!employee) return null;
            return { employee: employeeNameParts(employee.toPrimitives()) };
          }),
      )
    ).filter((assignment): assignment is { employee: ReturnType<typeof employeeNameParts> } =>
      Boolean(assignment),
    );
    const branch = props.branchId
      ? await this.branchRepository.findById(props.branchId, props.companyId)
      : null;
    const warehouse = props.warehouseId
      ? await this.warehouseRepository.findById(props.warehouseId, props.companyId)
      : null;
    const userLabels = this.loadUserEmailMap([
      props.createdByUserId,
      props.submittedByUserId,
      props.paidByUserId,
    ]);
    return mapTransactionReportRow(
      {
        id: props.id,
        transactionNumber: props.transactionNumber,
        direction: props.direction,
        status: props.status,
        partyName: props.partyName,
        partyContactNumber: props.partyContactNumber,
        transactionDate: props.transactionDate,
        locationType: props.locationType,
        branchId: props.branchId,
        warehouseId: props.warehouseId,
        outsideLocationName: props.outsideLocationName,
        submittedAt: props.submittedAt,
        paidAt: props.paidAt,
        paymentReference: null,
        createdAt: props.createdAt,
        createdByUserId: props.createdByUserId,
        submittedByUserId: props.submittedByUserId,
        paidByUserId: props.paidByUserId,
        branch: branch ? { name: branch.toPrimitives().name } : null,
        warehouse: warehouse ? { name: warehouse.toPrimitives().name } : null,
        items,
        assignments,
      },
      userLabels,
    );
  }

  private matchesTransactionFilter(
    filter: ReportFilter,
    search: string | undefined,
    transactionId: string,
  ): boolean {
    const transaction = this.transactionStore.transactions.get(transactionId);
    if (!transaction) return false;
    const props = transaction.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!matchesArchived(filter.includeArchived, props.deletedAt)) return false;
    if (!inDateRange(props.transactionDate, filter.from, filter.to)) return false;
    if (filter.branchId && props.branchId !== filter.branchId) return false;
    if (filter.warehouseId && props.warehouseId !== filter.warehouseId) return false;
    if (filter.tripId && props.tripId !== filter.tripId) return false;
    if (filter.direction && props.direction !== filter.direction) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (
      filter.transactionNumber &&
      !props.transactionNumber.toLowerCase().startsWith(filter.transactionNumber.toLowerCase())
    ) {
      return false;
    }
    if (filter.employeeId) {
      const assigned = this.transactionStore.assignments.some(
        (row) => row.transactionId === transactionId && row.employeeId === filter.employeeId,
      );
      if (!assigned) return false;
    }
    if (search) {
      const matches =
        matchesSearch(props.transactionNumber, search) || matchesSearch(props.partyName, search);
      if (!matches) return false;
    }
    return true;
  }

  private async listTransactions(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.transactionStore.transactions.keys()].filter((id) =>
      this.matchesTransactionFilter(params.filter, params.search, id),
    );
    const rows = (await Promise.all(ids.map((id) => this.mapTransactionRow(id)))).filter(
      (row): row is TransactionReportRowProjection => row !== null,
    );
    return sortRows(
      rows,
      params.sort,
      {
        transactionDate: (row) => row.transactionDate,
        transactionNumber: (row) => row.transactionNumber,
        createdAt: (row) => row.createdAt,
        partyName: (row) => row.partyName,
        status: (row) => row.status,
      },
      'transactionDate',
    );
  }

  async listTransactionReports(params: ReportQueryParams) {
    const rows = await this.listTransactions(params);
    return paginateRows(rows, params.pagination);
  }

  async countTransactionReports(params: ReportExportQueryParams): Promise<number> {
    const rows = await this.listTransactions(params);
    return rows.length;
  }

  async batchTransactionReports(params: ReportExportQueryParams, skip: number, take: number) {
    const rows = await this.listTransactions(params);
    return rows.slice(skip, skip + take);
  }

  async listTripReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<TripReportRowProjection>> {
    return paginateRows([], params.pagination);
  }

  async countTripReports(_params: ReportExportQueryParams): Promise<number> {
    return 0;
  }

  async batchTripReports(_params: ReportExportQueryParams, _skip: number, _take: number) {
    return [] as TripReportRowProjection[];
  }

  async listExpenseReports(
    params: ReportQueryParams,
  ): Promise<ReportListResult<ExpenseReportRowProjection>> {
    return paginateRows([], params.pagination);
  }

  async countExpenseReports(_params: ReportExportQueryParams): Promise<number> {
    return 0;
  }

  async batchExpenseReports(_params: ReportExportQueryParams, _skip: number, _take: number) {
    return [] as ExpenseReportRowProjection[];
  }

  private async mapAttendanceRow(sessionId: string): Promise<AttendanceReportRowProjection | null> {
    const session = this.attendanceRepository.sessions.get(sessionId);
    if (!session) return null;
    const props = session.toPrimitives();
    const employee = await this.employeeRepository.findById(props.employeeId, props.companyId);
    if (!employee) return null;
    return mapAttendanceReportRow({
      id: props.id,
      status: props.status,
      timeInAt: props.timeInAt,
      timeOutAt: props.timeOutAt,
      adjustedTimeInAt: props.adjustedTimeInAt,
      adjustedTimeOutAt: props.adjustedTimeOutAt,
      employee: { id: employee.id, ...employeeNameParts(employee.toPrimitives()) },
    });
  }

  private matchesAttendanceFilter(
    filter: ReportFilter,
    search: string | undefined,
    sessionId: string,
  ): boolean {
    const session = this.attendanceRepository.sessions.get(sessionId);
    if (!session) return false;
    const props = session.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!inDateRange(props.timeInAt, filter.from, filter.to)) return false;
    if (filter.employeeId && props.employeeId !== filter.employeeId) return false;
    if (search) {
      const employee = this.employeeRepository.employees.get(props.employeeId);
      if (!employee) return false;
      const parts = employee.toPrimitives();
      const matches =
        matchesSearch(parts.firstName, search) ||
        matchesSearch(parts.lastName, search) ||
        matchesSearch(parts.employeeNumber, search);
      if (!matches) return false;
    }
    return true;
  }

  private async listAttendance(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.attendanceRepository.sessions.keys()].filter((id) =>
      this.matchesAttendanceFilter(params.filter, params.search, id),
    );
    const rows = (await Promise.all(ids.map((id) => this.mapAttendanceRow(id)))).filter(
      (row): row is AttendanceReportRowProjection => row !== null,
    );
    return sortRows(
      rows,
      params.sort,
      {
        timeInAt: (row) => row.timeIn,
        status: (row) => row.status,
      },
      'timeInAt',
    );
  }

  async listAttendanceReports(params: ReportQueryParams) {
    const rows = await this.listAttendance(params);
    return paginateRows(rows, params.pagination);
  }

  async countAttendanceReports(params: ReportExportQueryParams): Promise<number> {
    const rows = await this.listAttendance(params);
    return rows.length;
  }

  async batchAttendanceReports(params: ReportExportQueryParams, skip: number, take: number) {
    const rows = await this.listAttendance(params);
    return rows.slice(skip, skip + take);
  }

  private async mapLeaveRow(leaveId: string): Promise<LeaveReportRowProjection | null> {
    const record = this.leaveRepository.records.get(leaveId);
    if (!record) return null;
    const props = record.toPrimitives();
    const employee = await this.employeeRepository.findById(props.employeeId, props.companyId);
    if (!employee) return null;
    return mapLeaveReportRow({
      id: props.id,
      leaveType: props.leaveType,
      leaveDate: props.leaveDate,
      status: props.status,
      employee: { id: employee.id, ...employeeNameParts(employee.toPrimitives()) },
    });
  }

  private matchesLeaveFilter(
    filter: ReportFilter,
    search: string | undefined,
    leaveId: string,
  ): boolean {
    const record = this.leaveRepository.records.get(leaveId);
    if (!record) return false;
    const props = record.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!inDateRange(props.leaveDate, filter.from, filter.to)) return false;
    if (filter.employeeId && props.employeeId !== filter.employeeId) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (search) {
      const employee = this.employeeRepository.employees.get(props.employeeId);
      if (!employee) return false;
      const parts = employee.toPrimitives();
      const matches =
        matchesSearch(parts.firstName, search) || matchesSearch(parts.lastName, search);
      if (!matches) return false;
    }
    return true;
  }

  private async listLeave(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.leaveRepository.records.keys()].filter((id) =>
      this.matchesLeaveFilter(params.filter, params.search, id),
    );
    const rows = (await Promise.all(ids.map((id) => this.mapLeaveRow(id)))).filter(
      (row): row is LeaveReportRowProjection => row !== null,
    );
    return sortRows(
      rows,
      params.sort,
      {
        leaveDate: (row) => row.leaveDate,
        leaveType: (row) => row.leaveType,
        status: (row) => row.status,
      },
      'leaveDate',
    );
  }

  async listLeaveReports(params: ReportQueryParams) {
    const rows = await this.listLeave(params);
    return paginateRows(rows, params.pagination);
  }

  async countLeaveReports(params: ReportExportQueryParams): Promise<number> {
    const rows = await this.listLeave(params);
    return rows.length;
  }

  async batchLeaveReports(params: ReportExportQueryParams, skip: number, take: number) {
    const rows = await this.listLeave(params);
    return rows.slice(skip, skip + take);
  }

  private async mapCashAdvanceRow(
    advanceId: string,
  ): Promise<CashAdvanceReportRowProjection | null> {
    const advance = this.cashAdvanceRepository.advances.get(advanceId);
    if (!advance) return null;
    const props = advance.toPrimitives();
    const employee = await this.employeeRepository.findById(props.employeeId, props.companyId);
    if (!employee) return null;
    const userLabels = this.loadUserEmailMap([props.createdByUserId]);
    return mapCashAdvanceReportRow(
      {
        id: props.id,
        amount: props.amount,
        remainingAmount: props.remainingAmount,
        status: props.status,
        issuedAt: props.issuedAt,
        createdByUserId: props.createdByUserId,
        employee: { id: employee.id, ...employeeNameParts(employee.toPrimitives()) },
      },
      userLabels,
    );
  }

  private matchesCashAdvanceFilter(
    filter: ReportFilter,
    search: string | undefined,
    advanceId: string,
  ): boolean {
    const advance = this.cashAdvanceRepository.advances.get(advanceId);
    if (!advance) return false;
    const props = advance.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!inDateRange(props.issuedAt, filter.from, filter.to)) return false;
    if (filter.employeeId && props.employeeId !== filter.employeeId) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (search) {
      const employee = this.employeeRepository.employees.get(props.employeeId);
      if (!employee) return false;
      const parts = employee.toPrimitives();
      const matches =
        matchesSearch(parts.firstName, search) || matchesSearch(parts.lastName, search);
      if (!matches) return false;
    }
    return true;
  }

  private async listCashAdvances(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.cashAdvanceRepository.advances.keys()].filter((id) =>
      this.matchesCashAdvanceFilter(params.filter, params.search, id),
    );
    const rows = (await Promise.all(ids.map((id) => this.mapCashAdvanceRow(id)))).filter(
      (row): row is CashAdvanceReportRowProjection => row !== null,
    );
    return sortRows(
      rows,
      params.sort,
      {
        createdAt: (row) => row.issuedAt,
        amount: (row) => row.amount,
        status: (row) => row.status,
      },
      'createdAt',
    );
  }

  async listCashAdvanceReports(params: ReportQueryParams) {
    const rows = await this.listCashAdvances(params);
    return paginateRows(rows, params.pagination);
  }

  async countCashAdvanceReports(params: ReportExportQueryParams): Promise<number> {
    const rows = await this.listCashAdvances(params);
    return rows.length;
  }

  async batchCashAdvanceReports(params: ReportExportQueryParams, skip: number, take: number) {
    const rows = await this.listCashAdvances(params);
    return rows.slice(skip, skip + take);
  }

  private async mapPayrollRow(payrollId: string): Promise<PayrollReportRowProjection | null> {
    const record = this.payrollRepository.records.get(payrollId);
    if (!record) return null;
    const props = record.toPrimitives();
    const employee = await this.employeeRepository.findById(props.employeeId, props.companyId);
    if (!employee) return null;
    const userLabels = this.loadUserEmailMap([props.updatedByUserId]);
    return mapPayrollReportRow(
      {
        id: props.id,
        payPeriodStart: props.payPeriodStart,
        payPeriodEnd: props.payPeriodEnd,
        grossSalary: props.grossSalary,
        cashAdvanceDeductions: props.cashAdvanceDeductions,
        netPay: props.netPay,
        status: props.status,
        paidAt: props.paidAt,
        updatedByUserId: props.updatedByUserId,
        employee: { id: employee.id, ...employeeNameParts(employee.toPrimitives()) },
      },
      userLabels,
    );
  }

  private matchesPayrollFilter(
    filter: ReportFilter,
    search: string | undefined,
    payrollId: string,
  ): boolean {
    const record = this.payrollRepository.records.get(payrollId);
    if (!record) return false;
    const props = record.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (filter.from && filter.to) {
      if (props.payPeriodStart > filter.to || props.payPeriodEnd < filter.from) return false;
    }
    if (filter.employeeId && props.employeeId !== filter.employeeId) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (search) {
      const employee = this.employeeRepository.employees.get(props.employeeId);
      if (!employee) return false;
      const parts = employee.toPrimitives();
      const matches =
        matchesSearch(parts.firstName, search) || matchesSearch(parts.lastName, search);
      if (!matches) return false;
    }
    return true;
  }

  private async listPayroll(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.payrollRepository.records.keys()].filter((id) =>
      this.matchesPayrollFilter(params.filter, params.search, id),
    );
    const rows = (await Promise.all(ids.map((id) => this.mapPayrollRow(id)))).filter(
      (row): row is PayrollReportRowProjection => row !== null,
    );
    return sortRows(
      rows,
      params.sort,
      {
        payPeriodStart: (row) => row.payPeriodStart,
        payPeriodEnd: (row) => row.payPeriodEnd,
        status: (row) => row.status,
      },
      'payPeriodStart',
    );
  }

  async listPayrollReports(params: ReportQueryParams) {
    const rows = await this.listPayroll(params);
    return paginateRows(rows, params.pagination);
  }

  async countPayrollReports(params: ReportExportQueryParams): Promise<number> {
    const rows = await this.listPayroll(params);
    return rows.length;
  }

  async batchPayrollReports(params: ReportExportQueryParams, skip: number, take: number) {
    const rows = await this.listPayroll(params);
    return rows.slice(skip, skip + take);
  }

  private mapEmployeeRow(employeeId: string): EmployeeReportRowProjection | null {
    const employee = this.employeeRepository.employees.get(employeeId);
    if (!employee) return null;
    const props = employee.toPrimitives();
    const user = props.userId
      ? [...this.userRepository.users.values()].find((entry) => entry.id === props.userId)
      : null;
    return mapEmployeeReportRow({
      id: props.id,
      employeeNumber: props.employeeNumber,
      firstName: props.firstName,
      middleName: props.middleName,
      lastName: props.lastName,
      suffix: props.suffix,
      contactNumber: props.contactNumber,
      weeklySalary: props.weeklySalary,
      status: props.status,
      createdAt: props.createdAt,
      user: user ? { email: user.toPrimitives().email } : null,
    });
  }

  private matchesEmployeeFilter(
    filter: ReportFilter,
    search: string | undefined,
    employeeId: string,
  ): boolean {
    const employee = this.employeeRepository.employees.get(employeeId);
    if (!employee) return false;
    const props = employee.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!matchesArchived(filter.includeArchived, props.deletedAt)) return false;
    if (!inDateRange(props.createdAt, filter.from, filter.to)) return false;
    if (filter.employeeId && props.id !== filter.employeeId) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (search) {
      const matches =
        matchesSearch(props.firstName, search) ||
        matchesSearch(props.lastName, search) ||
        matchesSearch(props.employeeNumber, search);
      if (!matches) return false;
    }
    return true;
  }

  private listEmployees(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.employeeRepository.employees.keys()].filter((id) =>
      this.matchesEmployeeFilter(params.filter, params.search, id),
    );
    const rows = ids
      .map((id) => this.mapEmployeeRow(id))
      .filter((row): row is EmployeeReportRowProjection => row !== null);
    return sortRows(
      rows,
      params.sort,
      {
        lastName: (row) => row.lastName,
        firstName: (row) => row.firstName,
        createdAt: (row) => row.createdAt,
        employeeNumber: (row) => row.employeeNumber,
      },
      'lastName',
    );
  }

  async listEmployeeReports(params: ReportQueryParams) {
    const rows = this.listEmployees(params);
    return paginateRows(rows, params.pagination);
  }

  async countEmployeeReports(params: ReportExportQueryParams): Promise<number> {
    return this.listEmployees(params).length;
  }

  async batchEmployeeReports(params: ReportExportQueryParams, skip: number, take: number) {
    return this.listEmployees(params).slice(skip, skip + take);
  }

  private countTransactionsForLocation(
    filter: ReportFilter,
    branchId?: string,
    warehouseId?: string,
  ): number {
    return [...this.transactionStore.transactions.values()].filter((transaction) => {
      const props = transaction.toPrimitives();
      if (props.companyId !== filter.companyId) return false;
      if (!matchesArchived(filter.includeArchived, props.deletedAt)) return false;
      if (props.status === 'CANCELLED') return false;
      if (branchId && props.branchId !== branchId) return false;
      if (warehouseId && props.warehouseId !== warehouseId) return false;
      return inDateRange(props.transactionDate, filter.from, filter.to);
    }).length;
  }

  private mapBranchRow(branchId: string, filter: ReportFilter): BranchReportRowProjection | null {
    const branch = this.branchRepository.branches.get(branchId);
    if (!branch) return null;
    const props = branch.toPrimitives();
    const hasPeriod = Boolean(filter.from && filter.to);
    const transactionCountInPeriod = hasPeriod
      ? this.countTransactionsForLocation(filter, props.id)
      : null;
    return mapBranchReportRow(
      {
        id: props.id,
        name: props.name,
        address: props.address,
        contactNumber: props.contactNumber,
        status: props.status,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      transactionCountInPeriod,
    );
  }

  private matchesBranchFilter(
    filter: ReportFilter,
    search: string | undefined,
    branchId: string,
  ): boolean {
    const branch = this.branchRepository.branches.get(branchId);
    if (!branch) return false;
    const props = branch.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!matchesArchived(filter.includeArchived, props.deletedAt)) return false;
    if (!inDateRange(props.createdAt, filter.from, filter.to)) return false;
    if (filter.branchId && props.id !== filter.branchId) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (search && !matchesSearch(props.name, search)) return false;
    return true;
  }

  private listBranches(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.branchRepository.branches.keys()].filter((id) =>
      this.matchesBranchFilter(params.filter, params.search, id),
    );
    const rows = ids
      .map((id) => this.mapBranchRow(id, params.filter))
      .filter((row): row is BranchReportRowProjection => row !== null);
    return sortRows(
      rows,
      params.sort,
      {
        name: (row) => row.name,
        createdAt: (row) => row.createdAt,
        status: (row) => row.status,
      },
      'name',
    );
  }

  async listBranchReports(params: ReportQueryParams) {
    const rows = this.listBranches(params);
    return paginateRows(rows, params.pagination);
  }

  async countBranchReports(params: ReportExportQueryParams): Promise<number> {
    return this.listBranches(params).length;
  }

  async batchBranchReports(params: ReportExportQueryParams, skip: number, take: number) {
    return this.listBranches(params).slice(skip, skip + take);
  }

  private mapWarehouseRow(
    warehouseId: string,
    filter: ReportFilter,
  ): WarehouseReportRowProjection | null {
    const warehouse = this.warehouseRepository.warehouses.get(warehouseId);
    if (!warehouse) return null;
    const props = warehouse.toPrimitives();
    const hasPeriod = Boolean(filter.from && filter.to);
    const transactionCountInPeriod = hasPeriod
      ? this.countTransactionsForLocation(filter, undefined, props.id)
      : null;
    return mapWarehouseReportRow(
      {
        id: props.id,
        name: props.name,
        address: props.address,
        contactNumber: props.contactNumber,
        status: props.status,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      transactionCountInPeriod,
    );
  }

  private matchesWarehouseFilter(
    filter: ReportFilter,
    search: string | undefined,
    warehouseId: string,
  ): boolean {
    const warehouse = this.warehouseRepository.warehouses.get(warehouseId);
    if (!warehouse) return false;
    const props = warehouse.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!matchesArchived(filter.includeArchived, props.deletedAt)) return false;
    if (!inDateRange(props.createdAt, filter.from, filter.to)) return false;
    if (filter.warehouseId && props.id !== filter.warehouseId) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (search && !matchesSearch(props.name, search)) return false;
    return true;
  }

  private listWarehouses(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.warehouseRepository.warehouses.keys()].filter((id) =>
      this.matchesWarehouseFilter(params.filter, params.search, id),
    );
    const rows = ids
      .map((id) => this.mapWarehouseRow(id, params.filter))
      .filter((row): row is WarehouseReportRowProjection => row !== null);
    return sortRows(
      rows,
      params.sort,
      {
        name: (row) => row.name,
        createdAt: (row) => row.createdAt,
        status: (row) => row.status,
      },
      'name',
    );
  }

  async listWarehouseReports(params: ReportQueryParams) {
    const rows = this.listWarehouses(params);
    return paginateRows(rows, params.pagination);
  }

  async countWarehouseReports(params: ReportExportQueryParams): Promise<number> {
    return this.listWarehouses(params).length;
  }

  async batchWarehouseReports(params: ReportExportQueryParams, skip: number, take: number) {
    return this.listWarehouses(params).slice(skip, skip + take);
  }

  private mapVehicleRow(
    vehicleId: string,
    filter: ReportFilter,
  ): VehicleReportRowProjection | null {
    const vehicle = this.vehicleRepository.vehicles.get(vehicleId);
    if (!vehicle) return null;
    const props = vehicle.toPrimitives();
    const hasPeriod = Boolean(filter.from && filter.to);
    return mapVehicleReportRow(
      {
        id: props.id,
        plateNumber: props.plateNumber,
        description: props.description,
        status: props.status,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      hasPeriod ? 0 : null,
    );
  }

  private matchesVehicleFilter(
    filter: ReportFilter,
    search: string | undefined,
    vehicleId: string,
  ): boolean {
    const vehicle = this.vehicleRepository.vehicles.get(vehicleId);
    if (!vehicle) return false;
    const props = vehicle.toPrimitives();
    if (props.companyId !== filter.companyId) return false;
    if (!matchesArchived(filter.includeArchived, props.deletedAt)) return false;
    if (!inDateRange(props.createdAt, filter.from, filter.to)) return false;
    if (filter.vehicleId && props.id !== filter.vehicleId) return false;
    if (filter.status && props.status !== filter.status) return false;
    if (search && !matchesSearch(props.plateNumber, search)) return false;
    return true;
  }

  private listVehicles(params: ReportQueryParams | ReportExportQueryParams) {
    const ids = [...this.vehicleRepository.vehicles.keys()].filter((id) =>
      this.matchesVehicleFilter(params.filter, params.search, id),
    );
    const rows = ids
      .map((id) => this.mapVehicleRow(id, params.filter))
      .filter((row): row is VehicleReportRowProjection => row !== null);
    return sortRows(
      rows,
      params.sort,
      {
        plateNumber: (row) => row.plateNumber,
        createdAt: (row) => row.createdAt,
        status: (row) => row.status,
      },
      'plateNumber',
    );
  }

  async listVehicleReports(params: ReportQueryParams) {
    const rows = this.listVehicles(params);
    return paginateRows(rows, params.pagination);
  }

  async countVehicleReports(params: ReportExportQueryParams): Promise<number> {
    return this.listVehicles(params).length;
  }

  async batchVehicleReports(params: ReportExportQueryParams, skip: number, take: number) {
    return this.listVehicles(params).slice(skip, skip + take);
  }
}

// Re-export for tests that assert money rounding behavior
export { buildEmployeeDisplayName, roundMoney };
