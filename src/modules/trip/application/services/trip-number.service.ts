import { TripNumber } from '../../domain/trip-number.js';
import type { TripNumberSequenceRepository } from '../../domain/trip-number-sequence.repository.js';
import { toPhSequenceDate } from '../../../../shared/datetime/philippine-time.js';

export class TripNumberService {
  constructor(private readonly tripNumberSequenceRepository: TripNumberSequenceRepository) {}

  /**
   * Allocates the next `TRIP-YYYYMMDD-000001` value for the given company and PH calendar date.
   */
  async allocate(companyId: string, tripDate: Date): Promise<string> {
    const sequenceDate = toPhSequenceDate(tripDate);

    const sequence = await this.tripNumberSequenceRepository.allocateNext(companyId, sequenceDate);
    return TripNumber.fromParts(tripDate, sequence).toString();
  }
}
