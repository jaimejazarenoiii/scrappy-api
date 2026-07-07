import type { TransactionItemUnit } from '../../domain/transaction-item-unit.js';

export interface AddTransactionItemRequestDto {
  materialName: string;
  weight: number;
  unit: TransactionItemUnit;
  price: number;
  total?: number;
  notes?: string;
}

export interface UpdateTransactionItemRequestDto {
  materialName?: string;
  weight?: number;
  unit?: TransactionItemUnit;
  price?: number;
  total?: number;
  notes?: string | null;
}
