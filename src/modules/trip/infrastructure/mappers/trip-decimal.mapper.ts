import type { Decimal } from '@prisma/client/runtime/library';

export function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

/** Distance traveled = ending − starting when both readings exist. */
export function computeTripDistance(
  startingOdometer: number | null,
  endingOdometer: number | null,
): number | null {
  if (startingOdometer === null || endingOdometer === null) return null;
  return endingOdometer - startingOdometer;
}
