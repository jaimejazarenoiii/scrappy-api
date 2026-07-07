/**
 * Computes a transaction item total as `weight * price` rounded to 2 decimal places.
 * Uses integer-cent rounding to avoid binary floating point drift.
 */
export function computeItemTotal(weight: number, price: number): number {
  return Math.round(weight * price * 100) / 100;
}
