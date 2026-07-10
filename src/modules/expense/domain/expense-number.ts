import {
  formatExpenseNumber,
  parseExpenseNumber,
} from '../../../shared/expenses/expense-number-format.js';

export class ExpenseNumber {
  private constructor(private readonly value: string) {}

  static create(value: string): ExpenseNumber {
    const parsed = parseExpenseNumber(value);
    if (!parsed || parsed.sequence <= 0) {
      throw new Error(`Invalid expense number: ${value}`);
    }
    return new ExpenseNumber(value);
  }

  static fromParts(expenseDate: Date, sequence: number): ExpenseNumber {
    if (!Number.isInteger(sequence) || sequence <= 0) {
      throw new Error(`Invalid expense number sequence: ${sequence}`);
    }
    return new ExpenseNumber(formatExpenseNumber(expenseDate, sequence));
  }

  toString(): string {
    return this.value;
  }

  toPrimitives(): string {
    return this.value;
  }
}
