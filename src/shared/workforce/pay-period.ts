import { ValidationAppError } from '../errors/http-exceptions.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns true when the inclusive date range spans exactly seven days.
 */
export function isWeeklyPeriod(payPeriodStart: Date, payPeriodEnd: Date): boolean {
  const start = Date.UTC(
    payPeriodStart.getUTCFullYear(),
    payPeriodStart.getUTCMonth(),
    payPeriodStart.getUTCDate(),
  );
  const end = Date.UTC(
    payPeriodEnd.getUTCFullYear(),
    payPeriodEnd.getUTCMonth(),
    payPeriodEnd.getUTCDate(),
  );
  const diffDays = Math.round((end - start) / MS_PER_DAY);
  return diffDays === 6;
}

/**
 * Validates weekly pay period boundaries.
 * @throws ValidationAppError when the range is invalid.
 */
export function validatePayPeriod(payPeriodStart: Date, payPeriodEnd: Date): void {
  if (payPeriodEnd < payPeriodStart) {
    throw new ValidationAppError('Pay period end must be on or after pay period start.');
  }
  if (!isWeeklyPeriod(payPeriodStart, payPeriodEnd)) {
    throw new ValidationAppError('Pay period must span exactly seven days.');
  }
}
