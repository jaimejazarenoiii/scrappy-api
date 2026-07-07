import type { TransactionItemEntity } from './transaction-item.entity.js';
import type { TransactionItemUnit } from './transaction-item-unit.js';

export interface CreateTransactionItemInput {
  id: string;
  transactionId: string;
  materialName: string;
  weight: number;
  unit: TransactionItemUnit;
  price: number;
  total: number;
  notes?: string | null;
}

export interface UpdateTransactionItemInput {
  materialName?: string;
  weight?: number;
  unit?: TransactionItemUnit;
  price?: number;
  total?: number;
  notes?: string | null;
}

export interface TransactionItemRepository {
  create(input: CreateTransactionItemInput): Promise<TransactionItemEntity>;
  findById(itemId: string, transactionId: string): Promise<TransactionItemEntity | null>;
  update(
    itemId: string,
    transactionId: string,
    input: UpdateTransactionItemInput,
  ): Promise<TransactionItemEntity>;
  delete(itemId: string, transactionId: string): Promise<void>;
  listByTransaction(transactionId: string): Promise<TransactionItemEntity[]>;
  countByTransaction(transactionId: string): Promise<number>;
}
