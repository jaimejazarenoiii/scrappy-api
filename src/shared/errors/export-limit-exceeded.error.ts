import { AppError } from './app-error.js';
import { ERROR_CODES } from './error-codes.js';

export class ExportLimitExceededError extends AppError {
  constructor(message = 'Export exceeds the maximum of 10,000 rows') {
    super(message, 422, ERROR_CODES.EXPORT_LIMIT_EXCEEDED);
  }
}
