import type { ExpenseContextType } from '../../domain/expense-context-type.js';

export interface CreateExpenseRequestDto {
  expenseDate: Date;
  category: string;
  amount: number;
  description: string;
  contextType: ExpenseContextType;
  branchId?: string;
  warehouseId?: string;
  vehicleId?: string;
  tripId?: string;
  recordImmediately?: boolean;
}
