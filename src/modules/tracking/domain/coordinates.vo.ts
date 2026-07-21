import { BusinessRuleViolationError } from '../../../shared/errors/http-exceptions.js';

/**
 * Validates geographic coordinates are within Earth bounds.
 */
export function assertValidCoordinates(latitude: number, longitude: number): void {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new BusinessRuleViolationError('Coordinates are out of valid range.');
  }
}
