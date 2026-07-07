import type { TransactionLocationType } from '../../domain/transaction-location-type.js';
import type { TransactionItemUnit } from '../../domain/transaction-item-unit.js';

export type TransactionDirectionInput = 'INBOUND' | 'OUTBOUND' | 'BUY' | 'SELL';

export interface CreateTransactionItemInputDto {
  materialName: string;
  weight: number;
  unit: TransactionItemUnit;
  price: number;
  total?: number;
  notes?: string;
}

export interface CreateTransactionRequestDto {
  direction: TransactionDirectionInput;
  partyName: string;
  partyContactNumber?: string;
  transactionDate?: Date;
  locationType: TransactionLocationType;
  branchId?: string;
  warehouseId?: string;
  outsideLocationName?: string;
  outsideAddress?: string;
  tripId?: string;
  notes?: string;
  assignedEmployeeIds: string[];
  items: CreateTransactionItemInputDto[];
}
