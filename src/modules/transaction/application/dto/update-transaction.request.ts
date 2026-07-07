import type { TransactionLocationType } from '../../domain/transaction-location-type.js';
import type { TransactionDirectionInput } from './create-transaction.request.js';

export interface UpdateTransactionRequestDto {
  direction?: TransactionDirectionInput;
  partyName?: string;
  partyContactNumber?: string | null;
  transactionDate?: Date;
  locationType?: TransactionLocationType;
  branchId?: string | null;
  warehouseId?: string | null;
  outsideLocationName?: string | null;
  outsideAddress?: string | null;
  tripId?: string | null;
  notes?: string | null;
  assignedEmployeeIds?: string[];
}
