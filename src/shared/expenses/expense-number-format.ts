export interface ParsedExpenseNumber {
  datePart: string;
  sequence: number;
}

import { toPhCompactDate } from '../datetime/philippine-time.js';

function toDatePart(expenseDate: Date): string {
  return toPhCompactDate(expenseDate);
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
