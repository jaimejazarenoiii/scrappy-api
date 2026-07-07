import type { PayrollStatus } from './payroll-status.js';

export interface PayrollRecordProps {
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
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePayrollRecordProps {
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

export class PayrollRecordEntity {
  private constructor(private readonly props: PayrollRecordProps) {}

  static create(props: PayrollRecordProps): PayrollRecordEntity {
    return new PayrollRecordEntity(props);
  }

  static createNew(props: CreatePayrollRecordProps): PayrollRecordEntity {
    const now = new Date();
    return PayrollRecordEntity.create({
      id: props.id,
      companyId: props.companyId,
      employeeId: props.employeeId,
      payPeriodStart: props.payPeriodStart,
      payPeriodEnd: props.payPeriodEnd,
      grossSalary: props.grossSalary,
      cashAdvanceDeductions: props.cashAdvanceDeductions,
      netPay: props.netPay,
      status: 'PAYABLE',
      paidAt: null,
      paymentReference: null,
      createdByUserId: props.createdByUserId ?? null,
      updatedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get employeeId(): string {
    return this.props.employeeId;
  }
  get payPeriodStart(): Date {
    return this.props.payPeriodStart;
  }
  get payPeriodEnd(): Date {
    return this.props.payPeriodEnd;
  }
  get grossSalary(): number {
    return this.props.grossSalary;
  }
  get cashAdvanceDeductions(): number {
    return this.props.cashAdvanceDeductions;
  }
  get netPay(): number {
    return this.props.netPay;
  }
  get status(): PayrollStatus {
    return this.props.status;
  }
  get paidAt(): Date | null {
    return this.props.paidAt;
  }
  get paymentReference(): string | null {
    return this.props.paymentReference;
  }

  isPayable(): boolean {
    return this.props.status === 'PAYABLE';
  }

  isPaid(): boolean {
    return this.props.status === 'PAID';
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  markPaid(paymentReference: string | null, updatedByUserId: string | null): PayrollRecordEntity {
    return PayrollRecordEntity.create({
      ...this.props,
      status: 'PAID',
      paidAt: new Date(),
      paymentReference,
      updatedByUserId,
      updatedAt: new Date(),
    });
  }

  toPrimitives(): PayrollRecordProps {
    return { ...this.props };
  }
}
