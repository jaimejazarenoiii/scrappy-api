export interface ParsedTripNumber {
  datePart: string;
  sequence: number;
}

export interface ParsedTripNumberPrefix {
  year: string; // YYYY
  month?: string; // optional MM when prefix includes month
}

function toDatePart(tripDate: Date): string {
  const year = tripDate.getUTCFullYear();
  const month = String(tripDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(tripDate.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatTripNumber(tripDate: Date, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error(`Invalid trip number sequence: ${sequence}`);
  }
  const datePart = toDatePart(tripDate);
  const paddedSequence = String(sequence).padStart(6, '0');
  return `TRIP-${datePart}-${paddedSequence}`;
}

/**
 * Parses a fully-qualified trip number like `TRIP-20260708-000001`.
 */
export function parseTripNumber(value: string): ParsedTripNumber | null {
  const match = /^TRIP-(\d{8})-(\d{6})$/.exec(value);
  if (!match) return null;
  return { datePart: match[1], sequence: Number(match[2]) };
}

/**
 * Parses a trip number prefix used for search.
 *
 * Examples:
 * - `TRIP-2026`      -> { year: '2026' }
 * - `TRIP-202607`   -> { year: '2026', month: '07' }
 */
export function parseTripNumberPrefix(value: string): ParsedTripNumberPrefix | null {
  const match = /^TRIP-(\d{4})(\d{2})?$/.exec(value);
  if (!match) return null;
  const year = match[1];
  const month = match[2];
  return month ? { year, month } : { year };
}
