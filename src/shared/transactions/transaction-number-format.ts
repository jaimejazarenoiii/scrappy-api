import type { TransactionDirection } from '../../modules/transaction/domain/transaction-direction.js';
import { toPhCompactDate } from '../datetime/philippine-time.js';

export interface ParsedTransactionNumber {
  prefix: 'IN' | 'OUT';
  datePart: string;
  sequence: number;
}

function toPrefix(direction: TransactionDirection): 'IN' | 'OUT' {
  return direction === 'INBOUND' ? 'IN' : 'OUT';
}

export function formatTransactionNumber(
  direction: TransactionDirection,
  transactionDate: Date,
  sequence: number,
): string {
  const prefix = toPrefix(direction);
  const datePart = toPhCompactDate(transactionDate);
  const paddedSequence = String(sequence).padStart(6, '0');
  return `${prefix}-${datePart}-${paddedSequence}`;
}

export function parseTransactionNumberPrefix(value: string): 'INBOUND' | 'OUTBOUND' | null {
  if (value.startsWith('IN-')) return 'INBOUND';
  if (value.startsWith('OUT-')) return 'OUTBOUND';
  return null;
}

export function parseTransactionNumber(value: string): ParsedTransactionNumber | null {
  const match = /^(IN|OUT)-(\d{8})-(\d{6})$/.exec(value);
  if (!match) return null;
  return {
    prefix: match[1] as 'IN' | 'OUT',
    datePart: match[2],
    sequence: Number(match[3]),
  };
}
