import type { CashAdvanceStatus } from '../../domain/cash-advance-status.js';

export interface CashAdvanceResponseDto {
  id: string;
  companyId: string;
  employeeId: string;
  amount: number;
  deductedAmount: number;
  remainingAmount: number;
  status: CashAdvanceStatus;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
