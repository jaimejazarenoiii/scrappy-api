import { TripNumber } from '../../domain/trip-number.js';
import type { TripNumberSequenceRepository } from '../../domain/trip-number-sequence.repository.js';

export class TripNumberService {
  constructor(private readonly tripNumberSequenceRepository: TripNumberSequenceRepository) {}

  /**
   * Allocates the next `TRIP-YYYYMMDD-000001` value for the given company and UTC calendar date.
   */
  async allocate(companyId: string, tripDate: Date): Promise<string> {
    const sequenceDate = new Date(
      Date.UTC(tripDate.getUTCFullYear(), tripDate.getUTCMonth(), tripDate.getUTCDate()),
    );

    const sequence = await this.tripNumberSequenceRepository.allocateNext(companyId, sequenceDate);
    return TripNumber.fromParts(tripDate, sequence).toString();
  }
}
