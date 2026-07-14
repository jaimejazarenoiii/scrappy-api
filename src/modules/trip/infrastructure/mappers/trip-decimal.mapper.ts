import type { Decimal } from '@prisma/client/runtime/library';

export function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}
