import type { TransactionDirection } from './transaction-direction.js';

export interface AllocateTransactionNumberSequenceInput {
  companyId: string;
  direction: TransactionDirection;
  sequenceDate: Date;
}

export interface TransactionNumberSequenceRepository {
  allocateNext(input: AllocateTransactionNumberSequenceInput): Promise<number>;
}
