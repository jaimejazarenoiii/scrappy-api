import type { ErrorRequestHandler } from 'express';
import { getLogger } from '../config/logger.js';
import { AppError } from '../shared/errors/app-error.js';
import { ERROR_CODES } from '../shared/errors/error-codes.js';
import { failure } from '../shared/http/api-response.js';

export const errorHandlerMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const logger = getLogger();
  if (error instanceof AppError) {
    logger.warn(
      { requestId: req.requestId, code: error.code, details: error.details },
      error.message,
    );
    res
      .status(error.statusCode)
      .json(failure({ code: error.code, message: error.message, details: error.details }));
    return;
  }
  logger.error({ requestId: req.requestId, error }, 'Unhandled error');
  res
    .status(500)
    .json(
      failure({
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        details: [],
      }),
    );
};
