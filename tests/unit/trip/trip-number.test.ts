import { describe, expect, it } from 'vitest';
import { TripNumber } from '../../../src/modules/trip/domain/trip-number.js';
import {
  formatTripNumber,
  parseTripNumber,
  parseTripNumberPrefix,
} from '../../../src/shared/trips/trip-number-format.js';

describe('trip number formatting', () => {
  it('formats trip numbers', () => {
    const date = new Date('2026-07-08T03:00:00.000Z');
    expect(formatTripNumber(date, 1)).toBe('TRIP-20260708-000001');
    expect(formatTripNumber(date, 42)).toBe('TRIP-20260708-000042');
  });

  it('parses prefix and number parts', () => {
    expect(parseTripNumberPrefix('TRIP-2026')).toEqual({ year: '2026' });
    expect(parseTripNumberPrefix('TRIP-202607')).toEqual({ year: '2026', month: '07' });
    expect(parseTripNumberPrefix('BAD')).toBeNull();

    expect(parseTripNumber('TRIP-20260708-000123')).toEqual({
      datePart: '20260708',
      sequence: 123,
    });
  });

  it('validates trip number inputs', () => {
    expect(() => TripNumber.create('TRIP-20260708-000000')).toThrow(/Invalid trip number/);
    expect(() => TripNumber.fromParts(new Date('2026-07-08T00:00:00.000Z'), 0)).toThrow(
      /Invalid trip number sequence/,
    );
    expect(() => TripNumber.create('bad')).toThrow(/Invalid trip number/);
  });
});
