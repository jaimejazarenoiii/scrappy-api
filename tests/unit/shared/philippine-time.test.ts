import { describe, expect, it } from 'vitest';
import {
  addPhDays,
  formatPhDate,
  isSamePhDay,
  parsePhDateInput,
  startOfPhDay,
  toPhCompactDate,
  toPhilippineOffsetIsoString,
} from '../../../src/shared/datetime/philippine-time.js';

describe('philippine time', () => {
  it('uses PH calendar date for compact document numbers', () => {
    const instant = new Date('2026-07-07T20:00:00.000Z');
    expect(toPhCompactDate(instant)).toBe('20260708');
    expect(formatPhDate(instant)).toBe('2026-07-08');
  });

  it('parses date-only input as PH midnight', () => {
    const day = parsePhDateInput('2026-07-08');
    expect(toPhilippineOffsetIsoString(day)).toBe('2026-07-08T00:00:00.000+08:00');
  });

  it('computes PH day boundaries', () => {
    const instant = new Date('2026-07-08T10:00:00.000Z');
    expect(formatPhDate(startOfPhDay(instant))).toBe('2026-07-08');
    expect(isSamePhDay(instant, parsePhDateInput('2026-07-08'))).toBe(true);
    expect(formatPhDate(addPhDays(parsePhDateInput('2026-07-08'), 1))).toBe('2026-07-09');
  });

  it('serializes API timestamps with +08:00 offset', () => {
    expect(toPhilippineOffsetIsoString(new Date('2026-07-08T06:30:00.000Z'))).toBe(
      '2026-07-08T14:30:00.000+08:00',
    );
  });
});
