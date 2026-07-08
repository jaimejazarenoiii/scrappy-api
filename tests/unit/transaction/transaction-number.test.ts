import { describe, expect, it } from 'vitest';
import { TransactionNumber } from '../../../src/modules/transaction/domain/transaction-number.js';
import {
  formatTransactionNumber,
  parseTransactionNumber,
  parseTransactionNumberPrefix,
} from '../../../src/shared/transactions/transaction-number-format.js';

describe('transaction number formatting', () => {
  it('formats inbound and outbound numbers', () => {
    const date = new Date('2026-07-08T03:00:00.000Z');
    expect(formatTransactionNumber('INBOUND', date, 1)).toBe('IN-20260708-000001');
    expect(formatTransactionNumber('OUTBOUND', date, 42)).toBe('OUT-20260708-000042');
  });

  it('parses prefixes and number parts', () => {
    expect(parseTransactionNumberPrefix('IN-20260708-000001')).toBe('INBOUND');
    expect(parseTransactionNumberPrefix('OUT-20260708-000001')).toBe('OUTBOUND');
    expect(parseTransactionNumberPrefix('BAD')).toBeNull();

    expect(parseTransactionNumber('IN-20260708-000123')).toEqual({
      prefix: 'IN',
      datePart: '20260708',
      sequence: 123,
    });
  });

  it('validates transaction number inputs', () => {
    expect(
      TransactionNumber.fromParts('INBOUND', new Date('2026-07-08T00:00:00.000Z'), 5).toString(),
    ).toBe('IN-20260708-000005');
    expect(() => TransactionNumber.create('bad')).toThrow(/Invalid transaction number/);
  });
});
