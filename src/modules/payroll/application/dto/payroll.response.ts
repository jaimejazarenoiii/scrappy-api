import type { PayrollStatus } from '../../domain/payroll-status.js';

export interface PayrollResponseDto {
  id: string;
  companyId: string;
  employeeId: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  grossSalary: number;
  cashAdvanceDeductions: number;
  netPay: number;
  status: PayrollStatus;
  paidAt: Date | null;
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratePayrollResponseDto {
  payPeriodStart: Date;
  payPeriodEnd: Date;
  items: PayrollResponseDto[];
}
