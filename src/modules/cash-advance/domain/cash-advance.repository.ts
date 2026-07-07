import type { CashAdvanceEntity } from './cash-advance.entity.js';
import type { CashAdvanceStatus } from './cash-advance-status.js';

export interface CreateCashAdvanceInput {
  id: string;
  companyId: string;
  employeeId: string;
  amount: number;
  reason?: string | null;
  createdByUserId?: string | null;
}

export interface ListCashAdvanceQuery {
  page: number;
  limit: number;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
  fromDate?: Date;
  toDate?: Date;
  employeeId?: string;
  status?: CashAdvanceStatus;
}

export interface ListCashAdvanceResult {
  items: CashAdvanceEntity[];
  total: number;
}

export interface CashAdvanceRepository {
  create(input: CreateCashAdvanceInput): Promise<CashAdvanceEntity>;
  findById(cashAdvanceId: string, companyId: string): Promise<CashAdvanceEntity | null>;
  listByEmployee(
    employeeId: string,
    companyId: string,
    query: ListCashAdvanceQuery,
  ): Promise<ListCashAdvanceResult>;
  listByCompany(companyId: string, query: ListCashAdvanceQuery): Promise<ListCashAdvanceResult>;
  sumOutstandingBalance(employeeId: string, companyId: string): Promise<number>;
  listOutstandingByEmployee(employeeId: string, companyId: string): Promise<CashAdvanceEntity[]>;
  applyDeduction(
    cashAdvanceId: string,
    companyId: string,
    amount: number,
  ): Promise<CashAdvanceEntity>;
}
