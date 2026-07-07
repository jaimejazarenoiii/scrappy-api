import type { PayrollRecordEntity } from './payroll-record.entity.js';
import type { PayrollStatus } from './payroll-status.js';

export interface CreatePayrollRecordInput {
  id: string;
  companyId: string;
  employeeId: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  grossSalary: number;
  cashAdvanceDeductions: number;
  netPay: number;
  createdByUserId?: string | null;
}

export interface MarkPayrollPaidInput {
  paymentReference?: string | null;
  updatedByUserId?: string | null;
}

export interface ListPayrollQuery {
  page: number;
  limit: number;
  sortBy?: 'payPeriodStart' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  payPeriodStart?: Date;
  payPeriodEnd?: Date;
  employeeId?: string;
  status?: PayrollStatus;
}

export interface ListPayrollResult {
  items: PayrollRecordEntity[];
  total: number;
}

export interface PayrollRecordRepository {
  create(input: CreatePayrollRecordInput): Promise<PayrollRecordEntity>;
  findById(payrollId: string, companyId: string): Promise<PayrollRecordEntity | null>;
  findByEmployeeAndPayPeriod(
    employeeId: string,
    companyId: string,
    payPeriodStart: Date,
  ): Promise<PayrollRecordEntity | null>;
  listByEmployee(
    employeeId: string,
    companyId: string,
    query: ListPayrollQuery,
  ): Promise<ListPayrollResult>;
  listByCompany(companyId: string, query: ListPayrollQuery): Promise<ListPayrollResult>;
  markPaid(
    payrollId: string,
    companyId: string,
    input: MarkPayrollPaidInput,
  ): Promise<PayrollRecordEntity>;
}
