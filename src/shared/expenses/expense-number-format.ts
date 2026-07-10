export interface ParsedExpenseNumber {
  datePart: string;
  sequence: number;
}

function toDatePart(expenseDate: Date): string {
  const year = expenseDate.getUTCFullYear();
  const month = String(expenseDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(expenseDate.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatExpenseNumber(expenseDate: Date, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error(`Invalid expense number sequence: ${sequence}`);
  }
  const datePart = toDatePart(expenseDate);
  const paddedSequence = String(sequence).padStart(6, '0');
  return `EXP-${datePart}-${paddedSequence}`;
}

export function parseExpenseNumber(value: string): ParsedExpenseNumber | null {
  const match = /^EXP-(\d{8})-(\d{6})$/.exec(value);
  if (!match) return null;
  return { datePart: match[1], sequence: Number(match[2]) };
}
