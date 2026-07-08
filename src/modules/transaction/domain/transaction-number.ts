import type { TransactionDirection } from './transaction-direction.js';
import {
  formatTransactionNumber,
  parseTransactionNumber,
} from '../../../shared/transactions/transaction-number-format.js';

export class TransactionNumber {
  private constructor(private readonly value: string) {}

  static create(value: string): TransactionNumber {
    const parsed = parseTransactionNumber(value);
    if (!parsed) {
      throw new Error(`Invalid transaction number: ${value}`);
    }
    return new TransactionNumber(value);
  }

  static fromParts(
    direction: TransactionDirection,
    transactionDate: Date,
    sequence: number,
  ): TransactionNumber {
    if (!Number.isInteger(sequence) || sequence <= 0) {
      throw new Error(`Invalid transaction number sequence: ${sequence}`);
    }
    return new TransactionNumber(formatTransactionNumber(direction, transactionDate, sequence));
  }

  toString(): string {
    return this.value;
  }

  toPrimitives(): string {
    return this.value;
  }
}
