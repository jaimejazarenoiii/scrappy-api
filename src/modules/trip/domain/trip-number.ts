import { formatTripNumber, parseTripNumber } from '../../../shared/trips/trip-number-format.js';

export class TripNumber {
  private constructor(private readonly value: string) {}

  static create(value: string): TripNumber {
    const parsed = parseTripNumber(value);
    if (!parsed || parsed.sequence <= 0) {
      throw new Error(`Invalid trip number: ${value}`);
    }
    return new TripNumber(value);
  }

  static fromParts(tripDate: Date, sequence: number): TripNumber {
    if (!Number.isInteger(sequence) || sequence <= 0) {
      throw new Error(`Invalid trip number sequence: ${sequence}`);
    }
    return new TripNumber(formatTripNumber(tripDate, sequence));
  }

  toString(): string {
    return this.value;
  }

  toPrimitives(): string {
    return this.value;
  }
}
