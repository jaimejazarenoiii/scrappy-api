import type { CashAdvanceEntity } from '../../../cash-advance/domain/cash-advance.entity.js';

export interface DeductionAllocation {
  cashAdvanceId: string;
  amount: number;
}

export interface PayrollDeductionResult {
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  allocations: DeductionAllocation[];
}

function sortFifo(advances: CashAdvanceEntity[]): CashAdvanceEntity[] {
  return [...advances].sort(
    (a, b) => a.toPrimitives().issuedAt.getTime() - b.toPrimitives().issuedAt.getTime(),
  );
}

export function allocateFifoDeductions(
  amountToDeduct: number,
  outstandingAdvances: CashAdvanceEntity[],
): DeductionAllocation[] {
  let remaining = amountToDeduct;
  const allocations: DeductionAllocation[] = [];

  for (const advance of sortFifo(outstandingAdvances)) {
    if (remaining <= 0) break;
    if (!advance.isOutstanding()) continue;

    const amount = Math.min(advance.remainingAmount, remaining);
    if (amount <= 0) continue;

    allocations.push({ cashAdvanceId: advance.id, amount });
    remaining -= amount;
  }

  return allocations;
}

export function calculateFifoDeductions(
  grossSalary: number,
  outstandingAdvances: CashAdvanceEntity[],
): PayrollDeductionResult {
  const allocations = allocateFifoDeductions(grossSalary, outstandingAdvances);
  const totalDeductions = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const netPay = grossSalary - totalDeductions;

  return {
    grossSalary,
    totalDeductions,
    netPay,
    allocations,
  };
}
