import type { TripReferenceChecker } from '../../src/modules/reports/application/services/report-filter-validator.service.js';

export class InMemoryTripReferenceChecker implements TripReferenceChecker {
  async exists(_tripId: string, _companyId: string): Promise<boolean> {
    return false;
  }
}
