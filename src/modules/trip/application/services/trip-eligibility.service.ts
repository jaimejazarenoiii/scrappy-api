import { BusinessRuleViolationError } from '../../../../shared/errors/http-exceptions.js';
import type { TripEntity } from '../../domain/trip.entity.js';

export class TripEligibilityService {
  assertTripAcceptsTransaction(trip: TripEntity): void {
    if (!trip.isStarted()) {
      throw new BusinessRuleViolationError('Outside transactions require a Started trip.');
    }
    if (trip.isCancelled()) {
      throw new BusinessRuleViolationError('Cancelled trips cannot accept outside transactions.');
    }
  }

  assertTripAcceptsExpense(trip: TripEntity): void {
    // Spec allows expenses for Started and Completed trips; cancelled/draft must be rejected.
    if (trip.isCancelled() || trip.isDraft()) {
      throw new BusinessRuleViolationError('This trip cannot accept expenses.');
    }
  }
}
