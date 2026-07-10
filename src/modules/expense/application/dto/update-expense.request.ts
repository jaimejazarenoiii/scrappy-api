import type { ExpenseContextType } from '../../domain/expense-context-type.js';

export interface UpdateExpenseRequestDto {
  expenseDate?: Date;
  category?: string;
  amount?: number;
  description?: string;
  contextType?: ExpenseContextType;
  branchId?: string | null;
  warehouseId?: string | null;
  vehicleId?: string | null;
  tripId?: string | null;
}
