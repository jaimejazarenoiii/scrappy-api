import { AppError } from './app.error.js';

/**
 * Error thrown when a requested resource or route is not found.
 */
export class NotFoundError extends AppError {
  /**
   * @param message - Client-safe not found message
   */
  constructor(message = 'Route not found') {
    super(message, 404, 'NOT_FOUND');
  }
}
