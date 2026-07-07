import { AppError } from './app.error.js';

/**
 * Error thrown when request validation fails.
 */
export class ValidationError extends AppError {
  /**
   * @param message - Client-safe validation message
   */
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
