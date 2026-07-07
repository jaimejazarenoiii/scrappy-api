import type { CashAdvanceStatus } from './cash-advance-status.js';

export interface CashAdvanceProps {
  id: string;
  companyId: string;
  employeeId: string;
  amount: number;
  deductedAmount: number;
  remainingAmount: number;
  status: CashAdvanceStatus;
  reason: string | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCashAdvanceProps {
  id: string;
  companyId: string;
  employeeId: string;
  amount: number;
  reason?: string | null;
  createdByUserId?: string | null;
}

export class CashAdvanceEntity {
  private constructor(private readonly props: CashAdvanceProps) {}

  static create(props: CashAdvanceProps): CashAdvanceEntity {
    return new CashAdvanceEntity(props);
  }

  static createNew(props: CreateCashAdvanceProps): CashAdvanceEntity {
    const now = new Date();
    return CashAdvanceEntity.create({
      id: props.id,
      companyId: props.companyId,
      employeeId: props.employeeId,
      amount: props.amount,
      deductedAmount: 0,
      remainingAmount: props.amount,
      status: 'OUTSTANDING',
      reason: props.reason ?? null,
      createdByUserId: props.createdByUserId ?? null,
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
  get amount(): number {
    return this.props.amount;
  }
  get deductedAmount(): number {
    return this.props.deductedAmount;
  }
  get remainingAmount(): number {
    return this.props.remainingAmount;
  }
  get status(): CashAdvanceStatus {
    return this.props.status;
  }

  isOutstanding(): boolean {
    return this.props.status === 'OUTSTANDING';
  }

  isSettled(): boolean {
    return this.props.status === 'SETTLED';
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  hasBalancedAmounts(): boolean {
    return this.props.deductedAmount + this.props.remainingAmount === this.props.amount;
  }

  toPrimitives(): CashAdvanceProps {
    return { ...this.props };
  }
}
